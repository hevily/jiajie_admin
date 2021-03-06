<template>
  <Card title="店铺列表">
    <Table :columns="columns" :data="data"></Table>
    <Modal
      :mask-closable="false"
      v-model="showExampleModal"
      title="输入审核不通过的理由"
      @on-ok="toExamineStore(currentId, currentIndex, -1)">
      <Form ref="formInline" :model="form" :label-width="80">
        <FormItem prop="reason" label="拒绝理由">
          <Input v-model="form.reason" type="textarea" :autosize="{minRows: 2,maxRows: 5}" :placeholder="form.reason"></Input>
        </FormItem>
      </Form>
    </Modal>
    <Modal
      title="查看店铺详情"
      :mask-closable="false"
      width="80"
      v-model="showItemModal">
      <Form :label-width="90" v-model="itemForm">
        <FormItem prop="store_name" label="店铺名称">
          <Input v-model="itemForm.store_name" placeholder="输入店铺名称"></Input>
        </FormItem>
        <FormItem prop="store_name" label="负责人姓名">
          <Input v-model="itemForm.store_director" placeholder="服务人姓名"></Input>
        </FormItem>
        <FormItem prop="store_name" label="负责人电话">
          <Input v-model="itemForm.store_phone" placeholder="负责人联系电话"></Input>
        </FormItem>
        <FormItem prop="store_name" label="店铺详细地址">
          <Input v-model="itemForm.store_address" placeholder="店铺详细地址"></Input>
        </FormItem>
        <FormItem prop="store_name" label="店铺图片">
          <div class="demo-upload-list" v-for="item in uploadList">
            <template v-if="item.status == 'finished'">
              <img :src="item.url">
              <div class="demo-upload-list-cover">
                <Icon type="ios-eye-outline" @click.native="handleView(item.url)"></Icon>
                <Icon type="ios-trash-outline" @click.native="handleRemove(item)"></Icon>
              </div>
            </template>
            <template v-else>
              <Progress v-if="item.showProgress" :percent="item.percentage" hide-info></Progress>
            </template>
          </div>
          <Upload
            ref="upload"
            :show-upload-list="false"
            :on-success="handleSuccess"
            :format="['jpg','jpeg','png']"
            :max-size="2048"
            :default-file-list="defaultFileList"
            :on-format-error="handleFormatError"
            :on-exceeded-size="handleMaxSize"
            :before-upload="handleBeforeUpload"
            multiple
            name="image"
            type="drag"
            :action="uploadAction"
            style="display: inline-block;width:58px;">
            <div style="width: 58px;height:58px;line-height: 58px;">
              <Icon type="ios-camera" size="20"></Icon>
            </div>
          </Upload>
        </FormItem>
      </Form>
    </Modal>
    <Modal title="View Image" v-model="visible">
      <img :src="imgName" v-if="visible" style="width: 100%">
    </Modal>
  </Card>
</template>

<script>
const api_prefix = window.config.api_prefix || 'http://jiajie-server.7dugo.com'
export default {
  name: 'storeList',
  mounted () {
    this.uploadList = this.$refs.upload.fileList
    this.$http('store.list').then(rs => {
      this.data = rs.data
    })
  },
  data () {
    return {
      api_prefix,
      defaultFileList: [],
      uploadAction: api_prefix + '/upload.image',
      imgName: '',
      visible: false,
      uploadList: [],
      itemForm: {
        store_name: '',
        store_director: '',
        store_phone: '',
        store_address: '',
        store_pic: []
      },
      currentId: 0,
      currentIndex: -1,
      form: {
        reason: '请输入拒绝的理由'
      },
      showItemModal: false,
      showExampleModal: false,
      columns: [
        {
          title: '店铺名称',
          key: 'store_name',
          width: 170,
          render: (h, params) => {
            return h('div', [
              h('img', {
                domProps: {
                  src: require('../../assets/images/自营标志.png'),
                  alt: '自营店铺',
                  title: '自营店铺'
                },
                style: {
                  marginRight: '5px',
                  display: params.row['store_type'] == 'SELF_SUPPORT' ? 'inline-block' : 'none',
                  width: '45px',
                  height: '16px'
                }
              }),
              h('span', params.row.store_name)
            ])
          }
        },
        {
          title: '负责人名字',
          key: 'store_director'
        },
        {
          title: '负责人电话',
          key: 'store_phone'
        },
        {
          title: '店铺等级',
          key: 'store_level'
        },
        {
          title: '已售数量',
          key: 'store_sold'
        },
        {
          title: '操作',
          width: 320,
          key: 'store_status',
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
                    this.$router.push({
                    	name: 'staffList',
                    	query: {
                    		storeId: params.row.id
                    	}
                    })
                  }
                }
              }, '管理店员'),
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
                    this.currentId = parseInt(params.row.id)
                    this.$http(`store.get-${this.currentId}`).then(rs => {
                      this.defaultFileList = this.uploadList = []
                      rs.data['store_pic'].forEach(pic => {
                        this.defaultFileList.push({
                          name: rs.data.store_name,
                          url: `${api_prefix}/${pic}`
                        })
                      })
                      this.uploadList = this.defaultFileList
                      Object.keys(this.itemForm).forEach(k => {
                        this.itemForm[k] = rs.data[k] || ''
                      })
                      this.$nextTick(() => {
                        this.showItemModal = true
                      })
                    })
                  }
                }
              }, '查看详情'),
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small'
                },
                style: {
                  marginRight: '5px',
                  display: (params.row.store_status == 1 || params.row.store_status == 2) ? 'inline-block' : 'none'
                },
                on: {
                  click: () => {
                    this.$router.push({
                      path: '/services/comment',
                      query: {
                        store_id: params.row.id
                      }
                    })
                  }
                }
              },'查看评论'),
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small'
                },
                style: {
                  marginRight: '5px',
                  display: (params.row.store_status == 0 || params.row.store_status == -1) ? 'inline-block' : 'none'
                },
                on: {
                  click: () => {
                    this.toExamineStore(params.row.id, params.index, 1)
                  }
                }
              }, '通过审核'),
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small'
                },
                style: {
                  marginRight: '5px',
                  display: params.row.store_status == 0 ? 'inline-block' : 'none'
                },
                on: {
                  click: () => {
                    this.currentId = params.row.id
                    this.currentIndex = params.index
                    this.showExampleModal = true
                  }
                }
              }, '拒接审核'),
              h('Button', {
                props: {
                  type: params.row.store_status == 1 ? 'error' : 'success',
                  size: 'small'
                },
                style: {
                  display: (params.row.store_status == 1 || params.row.store_status == 2) ? 'inline-block' : 'none'
                },
                on: {
                  click: () => {
                    this.updateStoreAuditing(params.row.id, params.index)
                  }
                }
              }, params.row.store_status == 1 ?'停用店铺' : '解除停用')
            ])
          }
        }
      ],
      data: []
    }
  },
  methods: {
    handleView (url) {
      this.imgName = url
      this.visible = true
    },
    handleRemove (file) {
      const imgUrl = file.url.replace(api_prefix, '')
      this.$http('file.remove', {
        files: [imgUrl]
      }).then(rs => {
        if (rs.error == 0) {
          const fileList = this.$refs.upload.fileList
          this.uploadList.splice(fileList.indexOf(file), 1)
        }
      })
    },
    handleSuccess (res) {
      if (res.error == 0) {
        this.uploadList.push({
          name: res.data['source_name'],
          url: `${api_prefix}/${res.data['path']}`,
          status: 'finished'
        })
      }
    },
    handleFormatError (file) {
      this.$Notice.warning({
        title: 'The file format is incorrect',
        desc: 'File format of ' + file.name + ' is incorrect, please select jpg or png.'
      });
    },
    handleMaxSize (file) {
      this.$Notice.warning({
        title: 'Exceeding file size limit',
        desc: 'File  ' + file.name + ' is too large, no more than 2M.'
      });
    },
    handleBeforeUpload () {
      const check = this.uploadList.length < 5;
      if (!check) {
        this.$Notice.warning({
          title: 'Up to five pictures can be uploaded.'
        });
      }
      return check;
    },
    /**
     * 执行审核店铺
     * @param storeId 店铺id
     * @param index 数据index
     * @param type 审核动作
     */
    toExamineStore (storeId, index, type) {
      let data = {
        pass: type,
        reason: this.form.reason
      }
      this.$http(`store.shenhe-${storeId}`, data).then(() => {
        this.data[index].store_status = type
      })
    },
    /**
     * 店铺启用、停用状态切换
     * @param storeId 店铺id
     * @param index 数据index
     */
    updateStoreAuditing (storeId, index) {
      this.$http(`store.auditing-${storeId}`).then(() => {
        const storeStatus = this.data[index].store_status
        this.data[index].store_status = storeStatus == 1 ? 2 : 1
      })
    }
  }
}
</script>

<style scoped>
.demo-upload-list{
  display: inline-block;
  width: 60px;
  height: 60px;
  text-align: center;
  line-height: 60px;
  border: 1px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  position: relative;
  box-shadow: 0 1px 1px rgba(0,0,0,.2);
  margin-right: 4px;
}
.demo-upload-list img{
  width: 100%;
  height: 100%;
}
.demo-upload-list-cover{
  display: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,.6);
}
.demo-upload-list:hover .demo-upload-list-cover{
  display: block;
}
.demo-upload-list-cover i{
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  margin: 0 2px;
}
</style>
