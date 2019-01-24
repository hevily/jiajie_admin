import axios from 'axios'
import store from '@/store'
import { Message } from 'iview'

class HttpRequest {
  constructor (baseURL) {
    this.baseURL = baseURL
    this.queue = {}
  }
  getInsideConfig () {
    let defaultConfig = {
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'X-SOURCE-SIGN': 'admin'
      }
    }
    if (store.state.user.token) {
      defaultConfig.headers['X-Token'] = store.state.user.token
    }
    return defaultConfig
  }
  destory (url) {
    delete this.queue[url]
  }
  interceptors (instance, url) {
    instance.interceptors.request.use(config => {
      this.queue[url] = true
      return config
    }, error => {
      return Promise.reject(error)
    })
    instance.interceptors.response.use(res => {
      this.destory(url)
      const {data, status} = res
      if (data.error === 401) {
        sessionStorage.removeItem('USER_TOKEN')
        window.location.href = '/login'
      } else if (data.error === 403) {
        Message.warning('无权操作')
      }
      return {data, status}
    }, error => {
      this.destory(url)
      return Promise.reject(error)
    })
  }
  request (options) {
    const instance = axios.create()
    options = Object.assign(this.getInsideConfig(), options)
    this.interceptors(instance, options.url)
    return instance(options)
  }
}

export default HttpRequest
