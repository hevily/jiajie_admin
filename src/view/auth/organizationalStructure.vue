<template>
  <section>
    <Card title="组织架构">
      <Form ref="formInline" :model="structureForm" inline>
        <FormItem prop="id">
          <treeselect
            :value="this.structureForm.parent_id"
            :searchable="false"
            :multiple="false"
            :options="structureData"
            noChildrenText="该层暂无下级"
            :default-expand-level="5"
            ref="structureData"
            style="width: 300px;"/>
        </FormItem>
        <FormItem prop="role_id">
          <treeselect
              :value="this.structureForm.role_id"
              :searchable="false"
              :multiple="false"
              :options="roleData"
              placeholder="请选择要添加的角色"
              noChildrenText="该角色暂无下级"
              ref="roleSelect"
              :default-expand-level="10"
              style="width: 300px;"/>
        </FormItem>
        <FormItem>
          <Button type="primary" icon="md-add" @click="handleAddClick" :loading="loading">添加</Button>
        </FormItem>
      </Form>
      <zk-table
          id="structureTable"
          ref="structureTable"
          sum-text="sum"
          index-text="#"
          :selection-type="false"
          :data="structureData"
          :columns="columns"
          :stripe="true"
          :border="true"
          :tree-type="true"
          :is-fold="props.isFold"
          :expand-type="false">
        <template slot="_action" slot-scope="scope">
          <Button :disabled="loading" v-if="scope.row.id && scope.row['label'].indexOf('组员') == -1" size="small"
                  :type="scope.row['label'].indexOf('组长') > -1 ? 'warning' : 'default'"
                  @click.native="handleSettingMaster(false, scope.row.id, scope.row.master_uid)">设置{{scope.row['label'].indexOf('组长') > -1 ? '组长' : '人员'}}</Button>
          <Button v-if="scope.row['label'].indexOf('组长') > -1" :disabled="loading" size="small" type="default" @click.native="handleSettingMember(scope.row.id)">设置组员</Button>
          <Button :disabled="loading" v-if="scope.row.isSettingMemberid" size="small" type="default" @click.native="handleUpdateLayer(false, scope.row.id, scope.row.parent_id, scope.row.role_id)">修改层次</Button>
          <Button :disabled="loading" v-if="scope.row.id" size="small" type="warning" @click.native="handleRemoveRole(scope.row['id'] || 0)">删除</Button>
        </template>
      </zk-table>
    </Card>
    <Modal title="修改层次" v-model="props.showLayerModal" @on-ok="handleUpdateLayer(true)" @on-cancel="loading = false">
      <Form ref="formInline" :model="structureForm" :label-width="80">
        <FormItem prop="id" label="所属上级">
          <treeselect
              :value="this.structureForm.parent_id"
              :searchable="false"
              :multiple="false"
              :options="structureData"
              noChildrenText="该层暂无下级"
              ref="structureData"
              :default-expand-level="10"
              style="width: 300px;"/>
        </FormItem>
        <!--<FormItem prop="role_id" label="所属用户组">-->
          <!--<treeselect-->
              <!--:value="this.structureForm.role_id"-->
              <!--:searchable="false"-->
              <!--:multiple="false"-->
              <!--:options="roleData"-->
              <!--placeholder="请选择要添加的角色"-->
              <!--noChildrenText="该角色暂无下级"-->
              <!--ref="roleSelect"-->
              <!--style="width: 300px;"/>-->
        <!--</FormItem>-->
        <FormItem>
          <Button type="primary" icon="md-add" @click="handleAddClick" :loading="loading">添加</Button>
        </FormItem>
      </Form>
    </Modal>
    <Modal v-model="props.showAssignStaff" title="设置人员" width="85" :mask-closable="false" @on-ok="handleSettingMaster(true)">
      <staff-list :store_id="1"
                  :selected_uid="structureForm.master_uid"
                  v-if="props.showAssignStaff"
                  :is-setting-member="props.isSettingMember"
                  :structure-id="structureForm.id"
                  @onClickRemoveGroup="handleRemoveGroup"
                  ref="showAssignStaff">
      </staff-list>
    </Modal>
  </section>
</template>

<script>
import StaffList from './component/StaffList/StaffList'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
export default {
  name: 'organizationalStructure',
  components: {
    Treeselect,
    StaffList
  },
  mounted () {
    this.getStructureData()
    this.getRoleData()
  },
  data () {
    return {
      props: {
        isFold: false,
        showLayerModal: false,
        showAssignStaff: false,
        isSettingMember: false
      },
      structureForm: {
          id: 0,
          role_name: '',
          master_uid: 0,
          master_uname: '',
          parent_id: 0,
          role_id: 0
      },
      structureData: [],
      roleData: [],
      columns: [
        {
          label: '角色名称',
          prop: 'label'
        },
        {
          label: '操作',
          type: 'template',
          template: '_action',
          width: 300
        }
      ],
      loading: false
    }
  },
  methods: {
    getStructureData () {
      this.$http('auth.role.structure').then(rs => {
        if (rs.data.length < 1) {
            this.structureData = [
              {
                label: '顶级角色',
                id: 0,
                parent_id: 0
              }
            ]
        } else {
          this.structureData = rs.data
        }
        this.structureForm.parent_id = this.structureData[0].id
      })
    },
    getRoleData () {
      this.$http('auth.role.list', {
        'data-set': 'tree',
        field: 'role_name as label',
        sort: {'role_sort': 'DESC'},
        condition: {
          role_viable: 1
        }
      }).then(rs => {
        this.roleData = rs.data
        this.structureForm.role_id = this.roleData[0].id
      })
    },
    handleAddClick () {
      this.loading = true
      this.$http('auth.role.structure.add', {
        role_id: this.$refs['roleSelect'].getValue() || 0,
        parent_id: this.$refs['structureData'].getValue()
      }).then(() => {
        this.getStructureData()
        this.loading = false
      }).catch(e => {
          this.loading = false
      })
    },
    handleRemoveRole (id) {
      if (id) {
        this.loading = true
        this.$http(`auth.role.structure.delete-${id}`).then(() => {
          this.getStructureData()
          this.loading = false
        }).catch(err => {
          this.loading = false
          this.$Message.warning(err[0])
        })
      }
    },
      /**
       * 修改层次
       * @param isPost
       * @param id
       * @param parent_id
       * @param role_id
       */
    handleUpdateLayer (isPost, id = null, parent_id = null, role_id = null) {
      if (!isPost) {
        this.loading = true
        this.structureForm.role_id = role_id
        this.structureForm.parent_id = parent_id
        this.structureForm.id = id
        this.props.showLayerModal = true
      } else {
        this.$http(`auth.role.structure.update-${this.structureForm.id}`, {
          parent_id: this.$refs['structureData'].getValue(),
          role_id: this.structureForm.role_id
        }).then(() => {
          this.getStructureData()
          this.loading = false
        }).catch(e => {
          this.$Message.warning(e[0])
          this.loading = false
        })
      }
    },
    handleSettingMaster (isPost, id, userId) {
      if (!isPost) {
        this.props.isSettingMember = false
        this.structureForm.id = id
        this.props.showAssignStaff = true
        this.structureForm.master_uid = parseInt(userId)
      } else {
        if (!this.structureForm.id) {
          this.$Message.info('组织ID为空')
          return
        }
        let post = {}
        let api = 'auth.role.structure.update'
        if (this.props.isSettingMember) {
          api += '-member'
          post['structure_id'] = this.structureForm.id
          post['member_list'] = this.$refs['showAssignStaff'].getSelectedUserIds()
        } else {
          api += '-master'
          post['structure_id'] = this.structureForm.id
          post['master_uid'] = this.$refs['showAssignStaff'].selectedUid
        }
        this.$http(api, post).then(() => {
          this.getStructureData()
        })
      }
    },
    /**
     * 设置组员
     * @param structureId 组织id
     */
    handleSettingMember (structureId) {
      this.structureForm.id = structureId
      this.props.isSettingMember = true
      this.props.showAssignStaff = true
    },
    /**
     * @desc 移除队员
     * @param userId
     */
    handleRemoveGroup (userId) {
      this.$Modal.confirm({
        title: '确认删除？',
        content: '确认删除？',
        onOk: () => {
          this.$http('auth.role.group.remove-member', {user_ids: [userId]}).then(() => {
            this.$refs['showAssignStaff'].getStaffOnStore()
          })
        },
        onCancel: () => {
        }
      });
      console.log(userId)
    }
  }
}
</script>

<style scoped>

</style>
