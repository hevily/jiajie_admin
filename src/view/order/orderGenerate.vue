<template>
  <Card title="订单生成">
    <Form :model="orderItem" :label-width="80">
      <FormItem label="预约分类">
        <treeselect :value="subscribe.cate_id || 0"
                    :searchable="false"
                    :multiple="false"
                    :options="categories"
                    placeholder="点击选择分类"
                    noChildrenText="该分类暂无下级"
                    ref="catSelect"
                    style="width: 300px;"/>
      </FormItem>
      <FormItem label="服务名称">
        <div v-if="modal.showSelectService.selectService">{{modal.showSelectService.selectService.service_name}}</div>
        <Button type="primary"
                @click="onSelectService(false)">
          {{serviceItemsTable ? '重新选择服务' : '选择服务'}}
        </Button>
        <Table
              v-if="serviceItemsTable && modal.showSelectService.serviceItemLists.length > 0"
              ref="serviceItems"
              style="margin-top: 10px;"
              @on-selection-change="onSelectServiceItem"
               :columns="modal.showSelectService.selectedColumns"
               :data="modal.showSelectService.serviceItemLists"></Table>
        <Page size="small"
              v-if="serviceItemsTable && modal.showSelectService.serviceItemLists.length > 0"
              :page-size="30"
              @on-change="onChangeServiceItemPage"
              show-total
              :current="modal.showSelectService.serviceItemCurrent"
              :total="modal.showSelectService.serviceItemTotal" />
      </FormItem>
      <FormItem label="选择数量" v-if="modal.showSelectService.selectService && modal.showSelectService.selectService.service_value_unit_id > 2">
        <div class="btn">
          <div class="left" @click="setCycle(0)">-</div>
          <div class="middle"><input v-model="service_length" type="number"></div>
          <div>{{getUnit(modal.showSelectService.selectService.service_value_unit_id).replace('元/','')}}</div>
          <div class="right" @click="setCycle(1)">+</div>
        </div>
      </FormItem>
      <FormItem label="预约方式">
        <Button type="primary" @click="generateOnce" :disabled="!modal.showSelectService.selectService">单次预约</Button>
        <Button type="primary" @click="generateWeek"
            v-if="modal.showSelectService.selectService && modal.showSelectService.selectService.service_value_unit_id == 2">
            周期预约</Button>
      </FormItem>
      <FormItem v-if="Object.keys(showOrders).length > 0 && modal.showSelectTime.type == 2" label="周期时间">
        <div class="li" v-for="item in showOrders">
          <div>{{formatTime(item.order_at*1000,item.order_length)}}&nbsp;&nbsp;￥{{item.charge}}</div>
        </div>
      </FormItem>
      <FormItem label="联系人电话">
        <Input v-model="orderItem.telephone" clearable></Input>
      </FormItem>
      <FormItem label="联系人姓名">
        <Input v-model="orderItem.contact_name" clearable></Input>
      </FormItem>
      <FormItem label="上门地址">
        <Button type="primary" @click="onSelectLocation">选择地址</Button>
        <div style="margin-top: 10px;">
          <span>定位信息: <span style="font-weight: bolder; color: #ff0000;">{{orderItem.address_name}}</span></span>
          <!--定位信息：<Input v-model="orderItem.address_name" style="width: 350px;" :disabled="true"></Input>-->
          门牌号:<Input v-model="orderItem.house_number" style="width: 350px;" clearable></Input>
        </div>
      </FormItem>
      <FormItem label="订单留言">
        <Input v-model="orderItem.message" clearable></Input>
      </FormItem>
      <FormItem label="价格小计">
        <!--orderItem.order_actual_amount-->
        <span style="font-weight: bolder; color: red; font-size: 16px;">{{allTotal}}</span>
        <!--<Input disabled="true" v-model="allTotal"></Input>-->
      </FormItem>
      <FormItem>
        <Button style="margin-bottom: 40px;" type="primary" @click="postOrder">确认提交</Button>
        <Button type="warning" style="margin-bottom: 40px; margin-left: 8px">返回需求列表</Button>
      </FormItem>
    </Form>
    <!--服务选择框 开始-->
    <Modal
      v-model="modal.showSelectService.show"
      title="选择服务"
      :width="80"
      :styles="{top: '10px'}"
      :mask-closable="false"
      @on-cancel="onCancelService">
      <Table :loading="modal.showSelectService.loading"
             :columns="modal.showSelectService.serviceColumns"
             :data="modal.showSelectService.serviceData"></Table>
      <div style="margin-top: 5px;">
        <Page size="small" :total="modal.showSelectService.total" :current="modal.showSelectService.current" @on-change="changeServicePage"></Page>
      </div>
    </Modal>
    <!--服务选择框 结束-->
    <!--地址选择框 开始-->
    <Modal
      v-model="modal.showSelectLocation.show"
      :width="80"
      :mask-closable="false"
      title="选择服务地址"
      @on-ok="onSelectLocation(false)"
      :styles="{top: '10px'}">
      <div class="amap-page-container">
        <el-amap-search-box class="search-box"
                            :search-option="modal.showSelectLocation.searchOption"
                            :on-search-result="onSearchResult"></el-amap-search-box>
        <el-amap ref="map" vid="amapDemo"
                 :amap-manager="modal.showSelectLocation.amapManager"
                 :center="modal.showSelectLocation.center"
                 :zoom="modal.showSelectLocation.zoom"
                 :plugin="modal.showSelectLocation.plugin"
                 :events="modal.showSelectLocation.events"
                 class="amap-demo">
          <el-amap-marker
            v-for="(marker, index) in modal.showSelectLocation.markers"
            :key="index"
            :position="marker.position"
            :events="marker.events"
            :data="marker.data"
          ></el-amap-marker>
          <el-amap-info-window
            :position="modal.showSelectLocation.currentWindow.position"
            :content="modal.showSelectLocation.currentWindow.content"
            :visible="modal.showSelectLocation.currentWindow.visible"
            :events="modal.showSelectLocation.currentWindow.events">
          </el-amap-info-window>
        </el-amap>
      </div>
    </Modal>
    <!--地址选择框 结束-->

      <!--选TM的服务周期-->
    <Modal
      v-model="modal.showSelectTime.showOnce"
      title="选择服务周期"
    >
      <Form ref="formInline">
        <reservation-once v-if="modal.showSelectTime.showOnce && modal.showSelectService.selectService" @finish="selectOnce" :service_id="modal.showSelectService.selectService.id" :once="modal.showSelectService.selectService.service_value_unit_id"></reservation-once>
      </Form>
    </Modal>
    <periodic-reservation v-if="modal.showSelectService.selectService" v-model="modal.showSelectTime.showWeek" @finish="selectWeek" :service_id="modal.showSelectService.selectService.id"></periodic-reservation>
    <div id="search-box" style="display: none;"></div>
  </Card>
</template>

<script>

import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import ServiceExpand from './components/ServiceExpand'
import VueAMap from 'vue-amap'
import periodicReservation from './components/periodicReservation'
import reservationOnce from './components/reservationOnce'
let amapManager = new VueAMap.AMapManager()
export default {
  name: 'orderGenerate',
  components: {
    Treeselect,
    ServiceExpand,
    periodicReservation,
    reservationOnce
  },
  mounted () {
    this.getSubscribe()
    this.getCategory()
    this.getUnitList()
  },
  data () {
    return {
      pois: [],
      currentServiceId: 0,
      serviceItemsTable: false,
      loading: false,
      modal: {
        showSelectLocation: {
          address: false,
          currentWindow: {
            position: [0, 0],
            content: '',
            events: {},
            visible: false
          },
          markers: [],
          show: false,
          loading: false,
          amapManager,
          zoom: 12,
          lng: 0,
          lat: 0,
          loaded: true,
          center: [121.59996, 31.197646],
          events: {
            init: (o) => {
            },
            'moveend': () => {
            },
            'zoomchange': () => {
            },
            'click': (e) => {
              this.modal.showSelectLocation.currentWindow.visible = false
              this.orderItem.order_lat = e.lnglat.lat
              this.orderItem.order_lng = e.lnglat.lng
              const geocoder = new AMap.Geocoder({
              })
              geocoder.getAddress(`${e.lnglat.lng},${e.lnglat.lat}`, (status, result) => {
                if (status === 'complete' && result.regeocode) {
                  const address = result.regeocode.formattedAddress
                  this.modal.showSelectLocation.address = address
                  this.$nextTick(() => {
                    this.modal.showSelectLocation.currentWindow.position = [e.lnglat.lng, e.lnglat.lat]
                    this.modal.showSelectLocation.currentWindow.content = address
                    this.modal.showSelectLocation.currentWindow.visible = true
                    this.modal.showSelectLocation.center = [e.lnglat.lng, e.lnglat.lat]
                  })
                } else {
                  console.log(result)
                }
              })
            }
          },
          plugin: ['ToolBar', {
            pName: 'MapType',
            defaultType: 0,
            events: {
              init (o) {
                console.log(o);
              }
            }
          }],
          searchOption: {
            city: '广州',
            citylimit: true,
            pageSize: 10,
            pageIndex: 1,
            panel: 'search-box'
          }
        },
        showSelectService: {
          itemTotal: 0,
          show: false,
          loading: false,
          total: 0,
          current: 0,
          serviceItemTotal: 0,
          serviceItemCurrent: 0,
          serviceItemLists: [],
          selectedColumns: [
            {
              type: 'selection',
              width: 60,
              align: 'center'
            },
            {
              title: '服务项目名称',
              key: 'item_name'
            },
            {
              title: '服务项目收费',
              key: 'item_change'
            },
            {
              title: '服务项目描述',
              key: 'item_desc'
            }
          ],
          serviceColumns: [
            {
              type: 'expand',
              width: 50,
              render: (h, params) => {
                return h(ServiceExpand, {
                  props: {
                    row: params.row
                  }
                })
              }
            },
            {
              title: '服务名称',
              key: 'service_name'
            },
            {
              title: '所属店铺',
              key: 'store_name'
            },
            {
              title: '价格',
              key: 'service_remuneration'
            },
            {
              title: '操作',
              key: '_action',
              render: (h, params) => {
                return h('div', [
                  h('Button', {
                    props: {
                      type: 'primary',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.handleSelectService(params.row)
                      }
                    }
                  }, '选择此服务')
                ])
              }
            }
          ],
          serviceData: []
        },
        showSelectTime: {
          showOnce: false,
          showWeek: false,
          onceData: {
            length: 1,
            time: ''
          },
          weekData: {},
          type:0
        },
        selectService: ''
      },
      unitList: [],
      subscribeId: this.$route.query.id || 0,
      subscribe: {},
      categories: [],
      orderItem: {
        cate_id: 0,
        order_type_id: 0,
        order_actual_amount: 0,
        telephone: '',
        contact_name: '',
        order_lat: 0,
        order_lng: 0,
        address_name: '',
        house_number: ''
      },
      orderInfo: {},
      showOrders: [],
      total: 0,
      selectService_items: [],
      service_length: 1
    }
  },
  computed: {
    allTotal () {
      if (this.modal.showSelectService.selectService && this.modal.showSelectService.selectService.service_value_unit_id > 2) {
        return Number(this.total) * this.service_length + Number(this.modal.showSelectService.itemTotal)
      } else {
        return Number(this.total) + Number(this.modal.showSelectService.itemTotal)
      }
    }
  },
  methods: {
    onClickMarker (index) {
      alert(index)
    },
    getSubscribe () {
      if (this.subscribeId) {
        this.$http(`user.subscribe.get-${this.subscribeId}`).then(rs => {
          this.orderItem.telephone = rs.data.subscribe_phone
          this.subscribe = rs.data
        })
      }
    },
    getCategory () {
      this.$http('category.list', {
          'data-set': 'tree',
          'field': 'cat_name as label, cate_is_show, cate_icon, is_self_support',
          sort: {
          is_self_support: 'DESC'
        }
      }).then(rs => {
        this.categories = rs.data
      })
    },
    getUnitList () {
      this.$http('service.util.list').then(rs => {
        this.unitList = rs.data
      })
    },
    getUnit (id) {
      let name = ''
      if (this.unitList.length) {
        this.unitList.forEach(item => {
          if (item.id == id) {
            name = item.unit_name
          }
        })
      }
      return name
    },
    setCycle (type) {
      type ? this.service_length ++ : this.service_length --
      if (this.service_length == 0) {
        this.service_length = 1
      }
    },
    /**
     * 选择服务
     */
    onSelectService (isPost = false) {
      if (!isPost) {
        this.modal.showSelectService.loading = this.modal.showSelectService.show = true
        this.getServiceList()
      }
    },
    getServiceList (page = 1) {
      // 获取当前选中的服务分类id
      this.orderItem.cate_id = this.$refs['catSelect'].getValue()
      this.$http('service.list', {
        page,
        rows: 30,
        condition: {
          service_level_1: this.orderItem.cate_id
        }
      }).then(rs => {
        this.modal.showSelectService.loading = false
        this.modal.showSelectService.serviceData = rs.data
      })
    },
    changeServicePage (page) {
      this.modal.showSelectService.current = page
      this.getServiceList(page)
    },
    /**
     * 选择地址操作
     */
    onSelectLocation (isShowModal = true) {
      if (isShowModal) {
        this.modal.showSelectLocation.show = this.modal.showSelectLocation.loading = true
      } else {
        if (this.modal.showSelectLocation.address) {
          let center = this.modal.showSelectLocation.center
          this.orderItem.address_name = this.modal.showSelectLocation.address
          this.orderItem.lal = center[0] + ',' + center[1]
        }
      }
    },
    onCancelService () {
      this.orderItem.address_name = ''
    },
    onSearchResult(pois) {
      let latSum = 0
      let lngSum = 0
      if (pois.length > 0) {
        this.pois = pois
        pois.forEach((poi, index) => {
          let {lng, lat} = poi
          lngSum += lng
          latSum += lat
          let data = this.pois[index]
          this.modal.showSelectLocation.markers.push(
            {
              position: [poi.lng, poi.lat],
              events: {
                click: (e) => {
                  console.log(e)
                  this.modal.showSelectLocation.currentWindow.position = [e.lnglat.lng, e.lnglat.lat]
                  this.modal.showSelectLocation.currentWindow.content = data.pname + data.cityname + (data.adname || '') + (data.address || '') + data.name
                  this.modal.showSelectLocation.currentWindow.visible = true
                  this.modal.showSelectLocation.center = [e.lnglat.lng, e.lnglat.lat]
                  this.orderItem.order_lat = e.lnglat.lat
                  this.orderItem.order_lng = e.lnglat.lng
                  this.modal.showSelectLocation.address = data.pname + data.cityname + (data.adname || '') + (data.address || '') + data.name
                }
              },
            }
          )
        })
        let center = {
          lng: lngSum / pois.length,
          lat: latSum / pois.length
        }
        this.modal.showSelectLocation.center = [center.lng, center.lat]
        this.modal.showSelectLocation.zoom = 18
      }
    },
    /**
     * 点击选择服务按钮
     * @param serviceId
     * @param page
     */
    handleSelectService (service, page = 1) {
      if (!this.serviceItemsTable) {
        this.serviceItemsTable = true
      }
      this.currentServiceId = service.id
      this.total = service.service_remuneration
      this.modal.showSelectService.selectService = service
      this.$http('service.item.list', {
        page,
        rows: 30,
        condition: {
          service_id: service.id
        }
      }).then(rs => {
        const serviceItemLists = rs.data
        this.modal.showSelectService.show = false
        if (serviceItemLists.length) {
          this.modal.showSelectService.serviceItemLists = serviceItemLists
        } else {
          // 无服务项目，取项目单价计费
          // this.$http(`service.get-${serviceId}`).then(rs => {
          //   this.$nextTick(() => {
          //     const serviceInfo = rs.data
          //     this.modal.showSelectService.serviceItemLists = [{
          //       item_name: serviceInfo.service_name,
          //       item_sn: serviceInfo.id,
          //       item_change: serviceInfo.service_remuneration,
          //       item_desc: serviceInfo.service_info,
          //       item_add_at: serviceInfo['examine_at']
          //     }]
          //     this.modal.showSelectService.serviceItemTotal = 1
          //     this.modal.showSelectService.serviceItemCurrent = 1
          //     this.modal.showSelectService.show = false
          //     // 默认选中
          //     this.$refs['serviceItems'].selectAll(true)
          //   })
          // })
        }
      })
    },
    /**
     * @param selection
     */
    onSelectServiceItem (selection) {
      // if (selection.length > 1) {
      //   this.$Notice.warning({
      //     title: '超过最大可选择数量',
      //     desc: '最多只能选择1个服务项目'
      //   })
      // }
      this.modal.showSelectService.itemTotal = 0
      this.selectService_items = []
      selection.forEach(item => {
        let obj = {id: item.id, length: 1}
        this.selectService_items.push(obj)
        this.modal.showSelectService.itemTotal += item.item_change
      })
    },
    /**
     * 服务项目页码改变触发
     * @param page
     */
    onChangeServiceItemPage (page) {
      this.handleSelectService(this.currentServiceId, page)
    },
    postOrder () {
      let data = {}
      data.service_id = this.currentServiceId
      data.service_message = this.modal.message
      data.order_sn = this.$route.query.order_sn
      if(!this.orderItem.address_name || !this.orderItem.lal){
        this.$Notice.warning({
          desc: '没有选择地址或者地址信息有误'
        })
        return
      } else {
        data.address_name = this.orderItem.address_name;
        data.order_lal = this.orderItem.lal;
      }
      if (!this.orderItem.telephone || !this.orderItem.contact_name) {
        this.$Notice.warning({
          desc: '请确定填写了手机号和联系人'
        })
        return
      } else {
        data.contact_name = this.orderItem.contact_name
        data.order_phone = this.orderItem.telephone
      }
      let api = 'user.buy.service-' + data.service_id + '-' + this.$route.query.id
      if (this.modal.showSelectTime.type == 1) {
        if (this.modal.showSelectTime.onceData.time) {
          data.contact_appointment_at = this.modal.showSelectTime.onceData.time
          data.service_length = this.modal.showSelectService.selectService.service_value_unit_id == 2 ? this.modal.showSelectTime.onceData.length : this.service_length
        } else {
          this.$Notice.warning({
            desc: '请选择开始时间'
          })
          return
        }
      } else if (this.modal.showSelectTime.type == 2){
        data.orders = this.orderInfo.order
        data.startTime = this.orderInfo.startTime
        data.cycleLong = this.orderInfo.cycleLong
        api = 'service.cyc.orders-' + data.service_id + '-' + this.$route.query.id
      } else {
        this.$Notice.warning({
          desc: '您是不是忘了选择服务时间了？'
        })
        return
      }
      if (this.selectService_items.length > 0) {
        data.service_item = this.selectService_items
      }
      this.$http(api, data).then(rs => {
        if (rs.error === 0) {
          this.$router.back(-1)
        } else {
          this.$Notice.warning({
            desc: rs.msg
          })
        }
      })
    },
    /* 选择周期 */
    // 单次
    generateOnce(){
      this.modal.showSelectTime.showOnce = true;
      this.modal.showSelectTime.type = 1;
      this.orderInfo = {};
    },
    // 周期
    generateWeek(){
      this.modal.showSelectTime.showWeek = true
      this.modal.showSelectTime.type = 2;
    },
    selectWeek (data) {
      this.showOrders = []
      this.orderInfo = data
      if (this.selectService_items.length > 0) {
        data.service_item = this.selectService_items
      }
      if (Object.keys(data).length) {
        this.$http('order.charge.calc-' + this.modal.showSelectService.selectService.id, data).then(rs => {
          this.showOrders = rs.data.orders
          this.total = rs.data.total_price
        })
      }
    },
    selectOnce (data) {
      if (this.modal.showSelectService.selectService.service_value_unit_id == 2) {
        if (this.selectService_items.length > 0) {
          data.service_item = this.selectService_items
        }

        if (Object.keys(data).length) {
          this.$http(`order.charge.calc-${this.modal.showSelectService.selectService.id}`, data).then(rs => {
            console.log(rs)
            this.modal.showSelectTime.onceData.time = this.getTime(rs.data.orders[0].order_at * 1000)
            this.modal.showSelectTime.onceData.length = rs.data.orders[0].order_length
            this.total = rs.data.total_price
          })
        }
      } else {
        this.modal.showSelectTime.onceData.time = data.resOrder[0].time
        this.modal.showSelectTime.onceData.length = data.resOrder[0].long
      }
    },
    getTime(time) {
      var data = new Date(time)
      if(data) {
        var year = data.getFullYear();
        var month = this.add0(data.getMonth() + 1);
        var day = this.add0(data.getDate());
        var hour = this.add0(data.getHours());
        var minute = this.add0(data.getMinutes());
        return year + '/' + month + '/' + day + ' ' + hour + ':' + minute
      } else {
        console.log('时间格式有误：' + time);
        return ''
      }
    },
    getDay (time) {
      let data = new Date(time)
      if (data) {
        let day = data.getDay()
        let cnDay = ''
        switch (day){
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
    formatTime (time, longs) {
      let data = new Date(time)
      let data2 = new Date(data.getTime() + longs * 60 * 60 * 1000)
      let year, month, day, hour, minute, hour2, minute2
      if (data) {
        year = data.getFullYear()
        month = this.add0(data.getMonth() + 1)
        day = this.add0(data.getDate())
        hour = this.add0(data.getHours())
        minute = this.add0(data.getMinutes())
      } else {
        console.log('时间格式有误：' + time)
        return ''
      }
      if (data2) {
        hour2 = this.add0(data2.getHours())
        minute2 = this.add0(data2.getMinutes())


      }

      return year + '-' + month + '-' + day + '(' + this.getDay(time) + ')' + hour + ':' + minute +'-'+ hour2 + ':' + minute2

    },
    add0 (time) {
      time = Number(time)
      if (time < 10) {
        time = '0' + time
      }
      return time
    }
  }
}
</script>

<style scoped>
.amap-demo {
  height: 450px;
}
.amap-demo {
  height: 300px;
}

.search-box {
  position: absolute;
  top: 25px;
  left: 100px;
}

.amap-page-container {
  position: relative;
}
.selectUnit .btn{
  display: flex;
  text-align: center;
  align-items: center;

}
.selectUnit .btn .left,.selectUnit .btn .right{
  width: 24px;
  height: 24px;
  line-height: 24px;
  border: 1px solid #b2b2b2;
}
.selectUnit .btn .middle{
  width: 60px;
  line-height: 24px;
  height: 24px;
  border: 1px solid #b2b2b2;
  border-left: 0;
  border-right: 0;
}
.btn{
  display: flex;
  text-align: center;
}
.btn>* {
  border-top: 1px solid #b2b2b2;
  border-bottom: 1px solid #b2b2b2;
}
.btn .left,.btn .right{
  width: .4rem;
  border: 1px solid #b2b2b2;
}
.btn .middle{
  width: .6rem;
}
.btn .middle input{
  width: 100%;
  border: none;
  webkit-appearance: none;
  outline: none;
  background: none;
}
</style>
