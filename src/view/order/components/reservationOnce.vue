<template>
  <div class="periodicReservation">
    <div class="center" style="font-size: 14px;">
      <div class="setLong"v-if="once == 2">
        <div class="label">服务时长</div>
        <div class="btn">
          <div class="left" @click="setLong(0)">-</div>
          <div class="middle">{{defaultLong}}小时</div>
          <div class="right" @click="setLong(1)">+</div>
        </div>
      </div>
      <div class="time">
        <div class="label">
          <div class="li" :class="{checked : defaultWeek == item.type}" v-for="item in week" @click="selectWeek(item.type)">{{item.name}}</div>
        </div>
        <div class="arr">
          <div class="li"
               :class="[{checked : checked && periodicData[defaultWeek] && periodicData[defaultWeek].order.indexOf(item.start_at) >= 0},
               {nochecked : !item.can_order}]"
               v-for="(item,index) in arr" @click="selectTime(item)">{{item.display_text}}</div>
          <!--为了最后一行能左对齐-->
          <div class="li" style="height: 0px;visibility: hidden;"></div>
          <div class="li" style="height: 0px;visibility: hidden;"></div>
          <div class="li" style="height: 0px;visibility: hidden;"></div>
          <div class="li" style="height: 0px;visibility: hidden;"></div>
          <!--为了最后一行能左对齐-->
        </div>
      </div>
      <div class="tip" >
        <div class="li" v-for="item in periodicData">{{once == 2 ? '服务时间：' : '上门时间：'}}{{getDay(item.order[0] * 1000)}} {{formatTime(item.order[0] * 1000)}}~{{getH(item.order[0] + item.long * 3600)}}</div>
      </div>
    </div>
  </div>
</template>

<script>
  export default{
    props: {
      service_id: {
        type: Number,
        default: 0
      },
      once: {
        type: Number,
        default: () => -1
      }
    },
    data () {
      return {
        defaultLong: 2,
        cycleLong: 1,
        show: false,
        arr: [],
        week: [
          {
            type: '1',
            name: '周一'
          },
          {
            type: '2',
            name: '周二'
          },
          {
            type: '3',
            name: '周三'
          },
          {
            type: '4',
            name: '周四'
          },
          {
            type: '5',
            name: '周五'
          },
          {
            type: '6',
            name: '周六'
          },
          {
            type: '0',
            name: '周日'
          },
        ],
        defaultWeek: new Date().getDay(),
        periodicData: {},
        checked: 0, // 无意义，用来刷新dom
        allStartTime: [],
        allOrder: {},
        startTime: '',
        selectStart: false
      }
    },
    mounted () {
      this.setArr()
    },
    watch: {
      defaultLong (val) {
        this.setArr()
      },
      startTime (val) {
        if (val) {
          this.getOrder()
        }
      },
      cycleLong (val) {
        this.getOrder()
      }
    },
    methods: {
      setArr () {
        let req = {}
        req.service_id = this.service_id
        req.service_week = this.defaultWeek
        req.service_length = this.defaultLong
        this.$http('service.get.ordercycle', req).then(rs => {
          this.arr = rs.data
        })
      },
      getH (str) {
        let newDate = new Date(str * 1000)
        if (newDate) {
          let h = newDate.getHours()
          let m = newDate.getMinutes()
          return this.add0(h) + ':' + this.add0(m)
        } else {
          return ''
        }
      },
      getDay (time) {
        let data = new Date(time)
        if (data) {
          let day = data.getDay()
          let cnDay = ''
          switch (day) {
            case 0 :
              cnDay = '周日'
              break
            case 1 :
              cnDay = '周一'
              break
            case 2 :
              cnDay = '周二'
              break
            case 3 :
              cnDay = '周三'
              break
            case 4 :
              cnDay = '周四'
              break
            case 5:
              cnDay = '周五'
              break
            case 6 :
              cnDay = '周六'
              break
          }
          return cnDay
        } else {
          console.log('时间格式有误：' + time)
          return ''
        }
      },
      // 转换时间
      formatTime (time) {
        let data = new Date(time)
        if (data) {
          let year = data.getFullYear();
          let month = this.add0(data.getMonth() + 1)
          let day = this.add0(data.getDate())
          let hour = this.add0(data.getHours())
          let minute = this.add0(data.getMinutes())
          return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
        } else {
          console.log('时间格式有误：' + time)
          return ''
        }
      },
      add0 (time) {
        time = Number(time)
        if (time < 10) {
          time = '0' + time
        }
        return time
      },
      setLong (type) { // 设置服务时长
        if (this.periodicData[this.defaultWeek]) {
          this.$Modal.confirm({
            content: '服务时长已选择' + this.defaultLong + '小时，是否重新选择',
            onOk: () => {
              this.checked = 1
              delete this.periodicData[this.defaultWeek]
            }
          })
        } else {
          if (type) {
            this.defaultLong += 0.5
          } else {
            this.defaultLong -= 0.5
          }
          if (this.defaultLong < 2) {
            this.defaultLong = 2
          }
          if (this.defaultLong > 6) {
            this.defaultLong = 6
          }
          this.setArr()
        }
      },
      selectWeek (type) {
        this.defaultWeek = type
        if (this.periodicData[type]) {
          this.defaultLong = this.periodicData[type].long
        }
        this.setArr()
      },
      selectTime (time) { // 添加服务时间
        if (time.can_order) {
          this.checked++ //没啥意义，为了刷新dom
          this.periodicData = {}
          this.periodicData[this.defaultWeek] = {}
          this.periodicData[this.defaultWeek].long = this.defaultLong
          this.periodicData[this.defaultWeek].order = []
          this.periodicData[this.defaultWeek].order.push(time.start_at)
          this.startTime = time.start_at * 1000
          this.getOrder()
        }
      },
      getOrder () {
        if (this.startTime) {
          let allOrder = []
          let reqOrder = {}
          Object.keys(this.periodicData).forEach(key =>{
            let order = this.periodicData[key].order[0]
            let time = this.formatTime(order * 1000)
            allOrder.push({time:time,long:this.periodicData[key].long})
            reqOrder[key] = {}
            reqOrder[key].order = [time]
            reqOrder[key].long = this.periodicData[key].long
          })
          this.allOrder.resOrder = allOrder
          this.allOrder.order = reqOrder
          this.allOrder.startTime = this.formatTime(this.startTime)
          this.$emit('finish', this.allOrder)
        }
      },
    }
  }
</script>

<style lang="less" scoped>
  @import "./periodcReservation.less";
</style>
