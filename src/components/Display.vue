<template id='Display'>
  <div class="row-content background-img" @click="login">
    <el-row>9900</el-row>
    <video></video>
  </div>
</template>


<script>
export default {
  name: "Display",
  props: {
    msg: []
  },
  data: function() {
    return {
      form: {},
      rules: {
        username: [{ required: true, message: "请输入帐号", trigger: "blur" }],
        password: [{ required: true, message: "请输入密码", trigger: "blur" }]
      },
      errMsg: ""
    };
  },
  methods: {
    login: function() {
      
      //const shell = window.electron.shell;

      const fs = window.fs;
      const os = require("os");
      const path = require("path");
      //const ipcRenderer = window.electron.ipcRenderer;
      const desktopCapturer = window.electron.desktopCapturer;
      // 主进程捕获到截图快捷键就让渲染进程截图
      console.log("ipcRenderer");
      console.log("shortcut-capture");
      // 获取屏幕数量
      // screen为electron的模块
      const getDesktopCapturer = desktopCapturer.getSources(
        {
          types: ["window", "screen"],
          thumbnailSize: {
            width: 400,
            height: 400
          }
        },
        function(error, sources) {
          if (error) throw error;
          console.log(sources);
        }
      );

      getDesktopCapturer
        .then(sources => {
          console.log(sources);
          for (var i = 0; i < sources.length; i++) {
            if (sources[i].name == "任务管理器") {
              let source = sources[i];
              console.log(os.tmpdir());
              const screenshotPath = path.resolve(
                os.tmpdir(),
                "../img/screenshot.png"
              );
              console.log(source.thumbnail.toDataURL());
              fs.writeFile(screenshotPath, source.thumbnail.toPNG(), function(
                error
              ) {
                if (error) return console.log(error);
                //shell.openExternal("file://" + screenshotPath);
                const message = `截图保存到: ${screenshotPath}`;
                console.log(message);
              });
            }
          }
        })
        .catch(error => console.log(error));
    }
  },
  filters: {
    getTime: function(value) {
      if (value) {
        return value.slice(8, 10) + ":" + value.slice(10, 12);
      } else {
        return "";
      }
    }
  },
  mounted: function() {
    console.log("display");
  }
};
</script>
<style>
.login {
  margin-top: 50px;
}

.btn-login {
  width: 100%;
}

.logo {
  margin-top: 60px;
  width: 200px;
}

.login .el-form-item {
  position: relative;
}

.login .el-form-item__label {
  position: absolute;
  left: 15px;
  top: 5px;
  z-index: 1;
}

.login .el-input__inner {
  padding-left: 80px;
  height: 50px;
  line-height: 50px;
}

.err-content .el-form-item__content {
  line-height: unset;
}

.background-img {
  background-size: 100% 100%;
  height: 100%;
}

.btn-login {
  background: #084885;
  border-color: #084885;
}

.btn-login:focus,
.btn-login:hover {
  background: #084885;
  border-color: #084885;
  color: #fff;
}

.btn-login:active {
  background: #05325d !important;
}
</style>