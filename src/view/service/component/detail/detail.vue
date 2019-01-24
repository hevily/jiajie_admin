<template>
  <div>
    <Card :title="isUpdate ? '修改服务' : '添加新服务'">
      <div slot="extra">
        <Button size="small" type="primary" @click="$router.push({name: 'servicesIndex'})">服务列表</Button>
        <Button size="small" type="primary" @click="onInsert" :loading="loading.insertBtn">提交</Button>
      </div>
      <Tabs value="generalTab">
        <TabPane label="通用信息" name="generalTab">
          <Form :model="formData" :label-width="100">
            <FormItem label="服务分类">
              <treeselect :multiple="false"
                          v-model="formData.service_cate_id"
                          :searchable="false"
                          :options="categories"
                          placeholder="点击选择分类"
                          noChildrenText="该分类暂无下级"
                          ref="catSelect"/>
            </FormItem>
            <FormItem label="服务名称">
              <Input v-model="formData.service_name"></Input>
            </FormItem>
            <FormItem label="服务方式">
              <Select v-model="formData.order_charging" style="width: 150px; float: left;">
                <Option v-for="(charging, index) in meta.order_charging" :key="index" :value="charging.key">
                  {{charging.title}}
                </Option>
              </Select>
            </FormItem>
            <FormItem label="服务售价">
              <Input style="width: 150px; float: left;" v-model="formData.service_remuneration"></Input>
            </FormItem>
            <FormItem label="清洁师酬劳">
              <Input style="width: 150px; float: left;" v-model="formData.remuneration"></Input>
            </FormItem>
            <FormItem label="计价单位">
              <Select @on-change="onChangeUnit" :label-in-value="true" v-model="formData.service_value_unit_id" style="width: 150px; float: left;"
                      :disabled="formData.order_charging === 'HAS_RESERVATION'">
                <Option v-for="(unit, index) in meta.order_unit" :key="index" :value="unit.id">{{unit.title}}</Option>
              </Select>
            </FormItem>
            <FormItem label="服务介绍图片">
              <Upload
                ref="serviceImg"
                name="image"
                :format="['jpg','jpeg','png', 'gif']"
                :max-size="2048"
                :action="uploadAction"
                :on-format-error="handleFormatError"
                :on-exceeded-size="handleMaxSize"
                :on-success="handleSuccessServiceImg"
                :show-upload-list="false">
                <Button icon="ios-cloud-upload-outline">上传图片</Button>
              </Upload>
              <div class="demo-upload-list" v-for="item in formData.service_img">
                <template>
                  <img :src="apiUrl + item" />
                  <div class="demo-upload-list-cover">
                    <Icon type="ios-eye-outline" @click.native="handleView(item)"></Icon>
                    <Icon type="ios-trash-outline" @click.native="handleRemoveServiceImg(item)"></Icon>
                  </div>
                </template>
              </div>
            </FormItem>
            <FormItem label="服务流程">
              <!--<ServiceFlow-->
                <!--:init-service-flows="formData.service_flow"-->
                <!--@on-add-item="onAddFlowItemEmit"-->
                <!--:is-update="isUpdate"></ServiceFlow>-->
              <Upload
                ref="serviceFlow"
                name="image"
                :format="['jpg','jpeg','png', 'gif']"
                :max-size="2048"
                :action="uploadAction"
                :on-format-error="handleFormatError"
                :on-exceeded-size="handleMaxSize"
                :on-success="handleSuccessServiceFlow"
                :show-upload-list="false">
                <Button icon="ios-cloud-upload-outline">上传图片</Button>
              </Upload>
              <div class="demo-upload-list" v-if="formData.service_flow">
                <template>
                  <img :src="apiUrl + formData.service_flow" />
                  <div class="demo-upload-list-cover">
                    <Icon type="ios-eye-outline" @click.native="handleView(formData.service_flow)"></Icon>
                    <Icon type="ios-trash-outline" @click.native="handleRemoveServiceFlow"></Icon>
                  </div>
                </template>
              </div>
            </FormItem>
            <FormItem label="专业设备">
              <!--<ProfessionalEquipment-->
                <!--:is-update="isUpdate"-->
                <!--@on-add-item="onAddEquipmentItemEmit"></ProfessionalEquipment>-->
              <Upload
                name="image"
                :format="['jpg','jpeg','png', 'gif']"
                :max-size="2048"
                :action="uploadAction"
                :on-format-error="handleFormatError"
                :on-exceeded-size="handleMaxSize"
                :on-success="handleSuccessEquipment"
                :show-upload-list="false">
                <Button icon="ios-cloud-upload-outline">上传图片</Button>
              </Upload>
              <div class="demo-upload-list" v-if="formData.service_equipment">
                <template>
                  <img :src="apiUrl + formData.service_equipment" />
                  <div class="demo-upload-list-cover">
                    <Icon type="ios-eye-outline" @click.native="handleView(formData.service_equipment)"></Icon>
                    <Icon type="ios-trash-outline" @click.native="handleRemoveEquipment"></Icon>
                  </div>
                </template>
              </div>
            </FormItem>
            <FormItem label="服务标准">
              <!--<ServiceStandards-->
                <!--:init-service-standards="formData.service_standards"-->
                <!--:is-update="isUpdate"-->
                <!--@on-add-item="onAddStandardsItemEmit"></ServiceStandards>-->
              <Upload
                name="image"
                :format="['jpg','jpeg','png', 'gif']"
                :max-size="2048"
                :action="uploadAction"
                :on-format-error="handleFormatError"
                :on-exceeded-size="handleMaxSize"
                :on-success="handleSuccessStandards"
                :show-upload-list="false">
                <Button icon="ios-cloud-upload-outline">上传图片</Button>
              </Upload>
              <div class="demo-upload-list" v-if="formData.service_standards">
                <template>
                  <img :src="apiUrl + formData.service_standards" />
                  <div class="demo-upload-list-cover">
                    <Icon type="ios-eye-outline" @click.native="handleView(formData.service_standards)"></Icon>
                    <Icon type="ios-trash-outline" @click.native="handleRemoveStandards"></Icon>
                  </div>
                </template>
              </div>
            </FormItem>
          </Form>
        </TabPane>
        <TabPane label="位置信息" name="mixTab">
          <Form>
            <FormItem label="服务地址">
              <div>{{formData.service_address_name}}</div>
              <el-amap :plugin="amap.plugin" ref="map" :center="center" :zoom="amap.zoom"
                       :amap-manager="amap.amapManager" style="height: 300px;" class="amap-box">
                <el-amap-search-box class="search-box" :search-option="amap.searchOption"
                                    :on-search-result="onSearchResult"></el-amap-search-box>
                <el-amap-marker vid="component-marker" :position="center"></el-amap-marker>
                <el-amap-marker vid="component-marker" v-for="marker in markers"
                  :position="marker.position"
                  :events="marker.events"
                ></el-amap-marker>
              </el-amap>
            </FormItem>
          </Form>
        </TabPane>
        <!--服务项目选项卡 开始-->
        <TabPane label="服务项目" name="itemsTab">
          <service-item
            :init-service-item="formData.item_arr"
            :items="serviceItems"
            :selectedUnit="selectedUnit"
            :is-update="isUpdate"
            @on-add-item="onAddItemEmit"></service-item>
        </TabPane>
        <!--服务项目选项卡 结束-->
        <TabPane label="服务详情" name="detailTab">
        	<Row>
        		<Col span="18">
              <UE :defaultMsg="formData.service_info" :config="config" ref="ue"></UE>
        		</Col>
        		<Col span="6">
        			<!--预览-->
        		</Col>
        	</Row>
        </TabPane>
      </Tabs>
    </Card>
    <Card style="text-align: center; margin-bottom: 80px;">
      <Button type="primary" @click="onInsert">确定</Button>
      <Button type="default">重置</Button>
    </Card>
    <div id="search-box" style="display: none;"></div>
    <Modal title="View Image" v-model="visible">
      <img :src="apiUrl + imgUrl" v-if="visible" style="width: 100%">
    </Modal>
  </div>
</template>

<script>
import ServiceItem from '../ServiceItem'
import ProfessionalEquipment from '../ProfessionalEquipment'
import ServiceFlow from '../ServiceFlow'
import ServiceStandards from '../serviceStandards'
import Treeselect from '@riophae/vue-treeselect'
import UE from '@/components/ueditor'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import VueAMap from 'vue-amap'
let amapManager = new VueAMap.AMapManager()
const apiUrl = window.config.api_prefix + '/'
export default {
  name: 'serviceInsert',
  props: {
    isUpdate: {
      type: Boolean,
      required: true
    },
    serviceId: {
      type: Number,
      default () {
        return 0
      }
    }
  },
  components: {
    UE,
    Treeselect,
    ServiceItem,
    ServiceFlow,
    ServiceStandards,
    ProfessionalEquipment
  },
  created () {
    if (this.isUpdate && this.serviceId) {
      this.$http(`service.get-${this.serviceId}`).then(rs => {
        Object.keys(this.formData).forEach(key => {
          this.formData[key] = rs.data.row[key] || ''
        })
        this.formData.service_cate_id = parseInt(rs.data.row.service_level_1)
        this.formData.service_name = rs.data.row.service_name
        rs.data.row.service_img && rs.data.row.service_img[0] === '' ? this.formData.service_img = [] : 1
        this.formData.order_charging = rs.data.row.order_charging
        this.formData.service_remuneration = rs.data.row.service_remuneration
        this.formData.service_value_unit_id = parseInt(rs.data.row.service_value_unit_id)
        this.formData.remuneration = rs.data.row.remuneration || 0
        this.formData.service_info = rs.data.row.service_info
        this.center = rs.data.row.service_lal.split(',')
        // 服务项目
        this.formData.item_arr = rs.data.row['service_item'] || []
        // 服务标准
        this.formData.service_standards = rs.data.row['service_standards']
        // 服务流程
        this.formData.service_flow = rs.data.row['service_flow']
        // 专业设备
        this.formData.service_equipment = rs.data.row['service_equipment']
      })
    }
    this.$http('category.list', {
      'data-set': 'tree',
      'field': 'cat_name as label, cate_is_show, cate_icon, is_self_support'
    }).then(rs => {
      this.categories = rs.data
    })
    this.$http('service.util.list').then(rs => {
      this.order_unit = rs.data
    })
  },
  data () {
    return {
      apiUrl,
      uploadAction: window.config.api_prefix + '/upload.image',
      config: {
        initialFrameWidth: null,
        initialFrameHeight: 350
      },
      selectedUnit: '元/次',
      loading: {
        insertBtn: false
      },
      serviceItems: [],
      categories: [],
      detailTab: {
        ueditor: {
          defaultMsg: '',
          config: {}
        }
      },
      amap: {
        amapManager,
        zoom: 12,
        plugin: [{
          pName: 'ToolBar'
        }],
        searchOption: {
          pageSize: 5, // 单页显示结果条数
          pageIndex: 1, // 页码
          city: '广州', // 兴趣点城市
          citylimit: true, // 是否强制限制在设置的城市内搜索
          panel: 'search-box'
        }
      },
      meta: {
        disabled: {
          order_charging: false
        },
        order_charging: [
          {
            key: 'FIXED_PRICE',
            title: '一口价'
          },
          {
            key: 'HAS_RESERVATION',
            title: '预约金'
          },
          {
            key: 'NON_RESERVATION',
            title: '免费预约'
          }
        ],
        order_unit: [
          {
            id: 1,
            title: '元/次'
          },
          {
            id: 2,
            title: '元/小时'
          },
          {
            id: 3,
            title: '元/个'
          },
          {
            id: 4,
            title: '元/平米'
          },
          {
            id: 5,
            title: '元/间'
          }
        ]
      },
      formData: {
        service_cate_id: 0,
        service_name: '',
        order_charging: '',
        service_remuneration: 0,
        service_value_unit_id: 1,
        service_info: '',
        service_lal: '',
        service_address_name: '',
        item_arr: [],
        service_equipment: [],
        service_flow: [],
        service_standards: [],
        remuneration: '',
        service_img: []
      },
      markers: [],
      center: [113.33339,22.99457],
      imgUrl: '',
      visible: false
    }
  },
  methods: {
    handleView (name) {
      this.imgUrl = name;
      this.visible = true;
    },
    handleMaxSize (file) {
      this.$Notice.warning({
        title: '文件体积过大',
        desc: '文件  ' + file.name + ' 超过最多允许的上传大小.'
      });
    },
    handleFormatError (file) {
      this.$Notice.warning({
        title: '文件类型不允许上传',
        desc: '文件' + file.name + '类型不允许上传'
      })
    },
    handleSuccessServiceFlow (response) {
      if (response.error === 0) {
        this.formData.service_flow = response.data.path
      }
    },
    handleRemoveServiceFlow () {
      this.formData.service_flow = ''
    },
    handleSuccessEquipment (response) {
      if (response.error === 0) {
        this.formData.service_equipment = response.data.path
      }
    },
    handleRemoveEquipment () {
      this.formData.service_equipment = ''
    },
    handleSuccessStandards (response) {
      if (response.error === 0) {
        this.formData.service_standards = response.data.path
      }
    },
    handleRemoveStandards () {
      this.formData.service_standards = ''
    },
    handleSuccessServiceImg (response) {
      if (response.error === 0) {
        this.formData.service_img.push(response.data.path)
      }
    },
    handleRemoveServiceImg (file) {
      let index = this.formData.service_img.indexOf(file)
      this.formData.service_img.splice(index, 1)

      console.log(file)
    },
    onAddItemEmit (item) {
      this.formData.item_arr = item
    },
    // onAddEquipmentItemEmit (item) {
    //   this.formData.service_equipment = item
    // },
    // onAddFlowItemEmit (item) {
    //   this.formData.service_flow = item
    // },
    // onAddStandardsItemEmit (item) {
    //   this.formData.service_standards = item
    //   console.log(this.formData.service_standards)
    // },
    onChangeUnit (e) {
      this.selectedUnit = e.label
    },
    onInsert () {
      this.loading.insertBtn = true
      this.formData.service_cate_id = parseInt(this.$refs['catSelect'].getValue())
      this.formData.service_info = this.$refs['ue'].getUEContent()
      const url = this.isUpdate ? `service.update-${this.serviceId}` : 'service.add'
      this.$http(url, this.formData).then(() => {
        this.loading.insertBtn = false
        this.$Message.success(this.isUpdate ? '添加成功' : '修改成功')
        this.$router.push({path: '/services/index'})
      }).catch(err => {
        err.forEach(e => {
          this.loading.insertBtn = false
          this.$Message.warning(e)
        })
      })
    },
    onSearchResult (pois) {
      let latSum = 0
      let lngSum = 0
      if (pois.length > 0) {
        this.amap.zoom = 18
        this.center = [pois[0].lng, pois[0].lat]
        pois.forEach((poi, index) => {
          let {lng, lat} = poi
          lngSum += lng
          latSum += lat
          let data = pois[index]
          this.markers.push(
            {
              position: [poi.lng, poi.lat],
              events: {
                click: (e) => {
                  console.log(e)
                  this.center = [e.lnglat.lng, e.lnglat.lat]
                  this.formData.service_lal = e.lnglat.lng + ',' + e.lnglat.lat
                  this.formData.service_address_name = data.pname + data.cityname + (data.adname || '') + (data.address || '') + data.name
                }
              },
            }
          )
        })
      }
    }
  }
}
</script>

<style scoped>
.amap-wrapper {
  width: 500px;
  height: 500px;
}

.search-box {
  position: absolute;
  top: 25px;
  left: 100px;
}

.amap-page-container {
  position: relative;
}
</style>
