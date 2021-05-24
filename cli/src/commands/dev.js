const {Command, flags} = require('@oclif/command')
const consola = require('consola')
const glob = require('glob')
const path = require('path')
const ejs = require('ejs')
const fs = require('fs-extra')
const debounce = require('lodash').debounce
const chokidar = require('chokidar')
const exec  = require('child_process').exec
const execSync  = require('child_process').execSync

const ROOT_PATH = path.resolve(process.cwd())
const ROOT_PATH_PAGE = path.resolve(`${ROOT_PATH}/template/src/pages`)
const ROOT_PATH_TEM = path.resolve(`${ROOT_PATH}/template/`)
const ROOT_PATH_DEST = path.resolve(`${ROOT_PATH}/.easynuxt`)
const ROOT_PATH_DEST_ROUTER = path.resolve(`${ROOT_PATH}/.easynuxt/src/router/nuxtrouter.js`)

class DevCommand extends Command {
  async run() {
    const {flags} = this.parse(DevCommand)
    const name = flags.name || 'world'
    await this.generateRoutesAndFiles()
    consola.success('正在安装依赖文件...')
    await execSync('npm install', {
      cwd: ROOT_PATH_DEST,
    })
    consola.success('依赖安装成功')
    await this.watchClient()
    await this.watchRestart()

    this.log(`hello ${name} from /Users/zhanglipeng/Work/tencent/easy-nuxt/cli/src/commands/dev.js`)
  }

  async generateRoutesAndFiles() {
    consola.debug('Generating nuxt files')
    consola.log(`${ROOT_PATH_PAGE}/template/src/pages/**.vue`)

    // 生成routes
    // 遍历vue文件
    let vueFiles = await glob.sync(`${ROOT_PATH_PAGE}/**/**.{vue,js}`) // 根据目录结构去搜索文件

    let routes = []
    let imports = []
    vueFiles.forEach((file, index) => {
      let name = file
      .replace(new RegExp(`^${ROOT_PATH_PAGE}`), '')
      .replace(/\.(vue|js)$/, '')
      .replace('/', '')
      routes.push({
        name,
        path: `/${name}`,
        component: `comp_${index}_name`,
      })
      imports.push(`import comp_${index}_name from '../pages/${name}.vue'`)
    })
    await fs.ensureDir(ROOT_PATH_DEST)

    await fs.copySync(ROOT_PATH_TEM, ROOT_PATH_DEST)
    ejs.renderFile(`${ROOT_PATH}/template/src/router/nuxtrouter.js`, {routes, imports}, (err, str) => {
      if (err) {
        consola.log(err)
      } else {
        fs.outputFileSync(ROOT_PATH_DEST_ROUTER, str)
      }
    })
    consola.success('Nuxt files generated')
  }

  watchClient() {
    const refreshFiles = debounce(() => this.generateRoutesAndFiles(), 200)
    chokidar.watch(ROOT_PATH_PAGE).on('all', (event, path) => {
      // consola.log(event, path)
      refreshFiles()
    })
  }

  watchRestart() {
    consola.success('服务器启动')
    // var exec  = require('child_process').exec
    // consola.success(`node ${ROOT_PATH_DEST}/server.js`)
    // var child = exec(`node ${ROOT_PATH_DEST}/server.js`)
    consola.success(`node ${ROOT_PATH_DEST}/server.js`)

    async function watch() {
      await exec(`npx nodemon ${ROOT_PATH_DEST}/server.js`, {
        cwd: ROOT_PATH_DEST,
      })
      consola.success('服务器启动成功')
      // chokidar.watch(ROOT_PATH_PAGE).on('all', (event, path) => {
      //   consola.log(event, path)
      //   child.kill()
      //   watch()
      // })
    }
    watch()
  }
}

DevCommand.description = `本地开发
...
Extra documentation goes here
`

DevCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = DevCommand
