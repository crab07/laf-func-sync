<template>
  <div class="container-main">
    <el-button
      @click="openDialog"
      type="primary"
      icon="el-icon-time"
      size="small"
      circle
    ></el-button>
    <!-- 函数列表表格 -->
    <el-dialog
      title="云函数列表"
      :visible.sync="dialogVisible"
      width="60%"
      top="10vh"
      :modal-append-to-body="false"
    >
      <el-table
        ref="filterTable"
        :data="funcList"
        height="52vh"
        style="width: 100%"
      >
        <el-table-column type="expand">
          <template slot-scope="props">
            <el-form
              label-position="right"
              label-width="90px"
              inline
              class="demo-table-expand"
            >
              <el-form-item class="el-form-item">
                <template v-slot:label>
                  <span class="my-label">描述</span>
                </template>
                <span>{{ props.row.desc }}</span>
              </el-form-item>
              <el-form-item class="el-form-item">
                <template v-slot:label>
                  <span class="my-label">方法</span>
                </template>
                <span v-if="!props.row.methods.length">{{ "无" }}</span>
                <el-tag
                  v-else
                  type="info"
                  style="margin-right: 5px"
                  v-for="item in props.row.methods"
                  :key="item"
                  >{{ item }}</el-tag
                >
              </el-form-item>
              <el-form-item class="el-form-item">
                <template v-slot:label>
                  <span class="my-label">标签</span>
                </template>
                <span v-if="!props.row.tags.length">{{ "无" }}</span>
                <el-tag
                  v-else
                  style="margin-right: 5px"
                  v-for="item in props.row.tags"
                  :key="item"
                  >{{ item }}</el-tag
                >
              </el-form-item>
              <el-form-item class="el-form-item">
                <template v-slot:label>
                  <span class="my-label">创建时间</span>
                </template>
                <span>{{ props.row.createdAt }}</span>
              </el-form-item>
              <el-form-item class="el-form-item">
                <template v-slot:label>
                  <span class="my-label">更新时间</span>
                </template>
                <span>{{ props.row.updatedAt }}</span>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column
          :filters="appFilters"
          :filter-method="handleAppFilter"
          show-overflow-tooltip
          prop="appName"
          label="应用"
          width="180"
        >
        </el-table-column>
        <el-table-column
          sortable
          show-overflow-tooltip
          prop="name"
          label="函数名"
          width="240"
        >
        </el-table-column>
        <el-table-column prop="cached" :label="cacheCount" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.cached === true" type="danger">
              {{ "有" }}
            </el-tag>
            <el-tag v-else type="info">
              {{ "无" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.cached"
              size="mini"
              @click="handleDiff(scope.$index, scope.row)"
              >Diff</el-button
            >
            <el-button
              v-if="scope.row.cached"
              type="primary"
              size="mini"
              icon="el-icon-refresh"
              @click="handleSync(scope.$index, scope.row)"
              >同步</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
    <!-- Diff信息 -->
    <el-dialog
      title="Diff (本地相较于云端)"
      :visible.sync="diffVisible"
      width="70%"
      top="10vh"
      :modal-append-to-body="false"
    >
      <div>
        <pre><span style="color: #007d65;">added:&nbsp;{{ added }}</span>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #aa363d">removed:&nbsp;{{ removed }}</span></pre>
        <div
          v-html="diffHtml"
          style="height: 65vh; overflow: auto; position: relative"
        ></div>
      </div>
    </el-dialog>
    <!-- 同步确认 -->
    <el-dialog
      title="请确认"
      :visible.sync="confirmVisible"
      width="35%"
      :modal-append-to-body="false"
    >
      <div>
        <div>
          确定同步应用
          <span style="font-weight: bold">{{ app2sync }}</span> 下的
          <span style="font-weight: bold">{{ func2sync }}</span> 函数吗？
        </div>
        <span style="color: #00baa4"
          >(将删除该函数的本地缓存，并刷新网页，使编辑器中的代码与云端一致)</span
        >
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="confirmVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmSync">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import "./app.less";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
const Diff = require("diff");

dayjs.extend(utc);

export default {
  data: function () {
    return {
      appFilters: [],
      appList: [],
      confirmVisible: false,
      dialogVisible: false,
      diffVisible: false,
      funcList: [],
      cacheCount: "本地缓存(0)",
      confirmMsg: "",
      diffHtml: "",
      added: 0,
      removed: 0,
      app2sync: "",
      appId2sync: "",
      func2sync: "",
      funcId2sync: null,
    };
  },
  methods: {
    async openDialog() {
      this.dialogVisible = true;
      await this.start();
    },
    async start() {
      this.resetData();
      // 当前环境不支持缓存则退出
      if (typeof Storage === "undefined") return;
      // 缓存中不存在token则退出
      const cachedToken = localStorage.getItem("token");
      if (cachedToken === null) return;
      // 设置axios请求头
      axios.defaults.headers.common["Authorization"] = `Bearer ${cachedToken}`;
      // 获取缓存函数列表
      const cachedFuncList = this.getCachedFuncList();
      try {
        // 获取应用列表
        const appList = await this.getAppList();
        let funcList = [];
        for (let i = 0; i < appList.length; i++) {
          const appid = appList[i].appid;
          // 获取应用下的云函数列表
          const thisFuncList = await this.getFuncList(appid);
          // console.log("thisFuncList: ", thisFuncList);
          if (thisFuncList.length) {
            thisFuncList.map((func) => {
              // 增加appName属性
              func.appName = `${appList[i].name} (${appList[i].appid})`;
              // 增加cached属性
              const indexCached = cachedFuncList.findIndex((cachedFuncKey) => {
                return cachedFuncKey.split("@")[1] === func.id;
              });
              func.cached = indexCached !== -1;
              // 格式化其他属性
              func.createdAt = dayjs(func.createdAt)
                .utc()
                .add(8, "h")
                .format("YYYY-MM-DD HH:mm:ss");
              func.updatedAt = dayjs(func.updatedAt)
                .utc()
                .add(8, "h")
                .format("YYYY-MM-DD HH:mm:ss");
              funcList.push(func);
            });
          }
        }
        // 根据是否有缓存排序
        funcList.sort((a, b) => {
          if (a.cached && !b.cached) return -1; // cached 为 true 的对象排在前面
          if (!a.cached && b.cached) return 1;
          return;
        });
        this.funcList = funcList;
        this.cacheCount = `本地缓存(${cachedFuncList.length})`;
      } catch (err) {
        console.log(err);
      }
    },
    resetData() {
      this.appList = [];
      this.appFilters = [];
      this.funcList = [];
    },
    async getAppList() {
      return new Promise(async (resolve, reject) => {
        try {
          const resGetAppList = await axios.get(
            "https://laf.run/v1/applications"
          );
          if (resGetAppList.status !== 200) {
            reject(resGetAppList.data);
            return;
          }
          if (resGetAppList.data.error) {
            reject(resGetAppList.data.error);
            return;
          }
          const appList = resGetAppList.data.data;
          if (appList.length) {
            appList.map((app) => {
              this.appFilters.push({
                text: `${app.name} (${app.appid})`,
                value: `${app.name} (${app.appid})`,
              });
            });
          }
          this.appList = appList;
          resolve(appList);
        } catch (err) {
          reject(err);
        }
      });
    },
    async getFuncList(appid) {
      return new Promise(async (resolve, reject) => {
        try {
          const resGetFuncList = await axios.get(
            `https://laf.run/v1/apps/${appid}/functions`
          );
          if (resGetFuncList.status !== 200) {
            reject(resGetFuncList.data);
            return;
          }
          if (resGetFuncList.data.error) {
            reject(resGetFuncList.data.error);
            return;
          }
          const funcList = resGetFuncList.data.data;
          resolve(funcList);
        } catch (err) {
          reject(err);
        }
      });
    },
    getCachedFuncList() {
      const cachePrefix = "$cached_function@";
      const cachedFuncList = Object.keys(localStorage).filter((key) => {
        return key.indexOf(cachePrefix) === 0;
      });
      return cachedFuncList;
    },
    handleAppFilter(value, row, column) {
      const property = column["property"];
      return row[property] === value;
    },
    formatDiffAsHTML(diff) {
      let added = 0,
        removed = 0,
        html = "";
      diff.forEach((part) => {
        if (part.added) added += part.count;
        if (part.removed) removed += part.count;
        const tag = part.added ? "ins" : part.removed ? "del" : "span";
        const text = part.value
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/(\r\n|\n|\r)/gm, "\n")
          .replace(/\t/g, "&nbsp;&nbsp;")
          .replace(/^\s\n/gm, "\n")
          .replace(/\n/g, "<br>");
        html += `<${tag}><pre style="background-color: ${
          part.added ? "#e6ffec" : part.removed ? "#ffebe9" : "#fff"
        }">${text}</pre></${tag}>`;
      });
      this.added = added;
      this.removed = removed;
      return html;
    },
    handleDiff(index, row) {
      const cachedCode = localStorage.getItem(`$cached_function@${row.id}`);
      const publishedCode = row.source.code;
      const diff = Diff.diffLines(publishedCode, cachedCode);
      this.diffHtml = this.formatDiffAsHTML(diff);
      this.diffVisible = true;
    },
    openConfirm() {
      this.confirmVisible = true;
    },
    handleSync(index, row) {
      const { id, appid, appName, name } = row;
      this.funcId2sync = id;
      this.app2sync = appName;
      this.appId2sync = appid;
      this.func2sync = name;
      this.confirmVisible = true;
    },
    confirmSync() {
      this.confirmVisible = false;
      localStorage.removeItem(`$cached_function@${this.funcId2sync}`);
      const newUrl = `https://${location.host}/app/${this.appId2sync}/function/${this.func2sync}`;
      location.replace(newUrl);
    },
  },
};
</script>
<style scoped>
.container-main {
  position: absolute;
  bottom: 4px;
  right: 4px;
}
.demo-table-expand {
  font-size: 0;
}
.my-label {
  width: 90px;
  color: #99a9bf;
}
.demo-table-expand .el-form-item {
  margin-right: 0;
  margin-bottom: 0;
  width: 60%;
}
</style>
