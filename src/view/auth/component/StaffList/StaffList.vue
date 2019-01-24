<template>
  <section>
    <Form ref="formInline" :model="searchForm" inline>
      <FormItem prop="user">
        <Select v-model="searchForm.role_id">
          <Option value="beijing">New York</Option>
          <Option value="shanghai">London</Option>
          <Option value="shenzhen">Sydney</Option>
        </Select>
      </FormItem>
      <FormItem prop="user">
        <Select v-model="searchForm.state">
          <Option value="beijing">New York</Option>
          <Option value="shanghai">London</Option>
          <Option value="shenzhen">Sydney</Option>
        </Select>
      </FormItem>
      <FormItem prop="Input">
        <Input search enter-button v-model="searchForm.keywork" placeholder="Enter something..."></Input>
      </FormItem>
    </Form>
    <Table :columns="columns" :data="data" highlight-row @on-row-click="handleRowClick" v-if="!isSettingMember"></Table>
    <Table :columns="columns" :data="data" ref="memberTable" :row-class-name="rowClassName" v-else></Table>
    <Page :total="40" size="small" show-total />
  </section>
</template>

<script>
export default {
  name: 'StaffList',
  props: {
    store_id: {
      type: Number,
      default: () => 0
    },
    selected_uid: {
      type: Number,
      default: () => 0
    },
    isSettingMember: {
      type: Boolean,
      default: () => false
    },
    structureId: {
      type: Number,
      default: () => 0
    }
  },
  mounted () {
    this.selectedUid = this.selected_uid
    this.getStaffOnStore()
    if (this.isSettingMember) {
      this.columns[0] = {
        type: 'selection',
        width: 60,
        align: 'center'
      }
      this.columns.push({
        title: '操作',
        width: 250,
        key: '_action',
        render: (h, params) => {
          return h('div', [
            // h('Button', {
            //   props: {
            //     size: 'small'
            //   },
            //   style: {
            //     marginRight: '5px'
            //   },
            // }, '修改'),
            // h('Button', {
            //   props: {
            //     size: 'small'
            //   },
            //   style: {
            //     marginRight: '5px'
            //   },
            // }, '停用'),
            h('Button', {
              props: {
                type: 'warning',
                size: 'small'
              },
              style: {
                marginRight: '5px',
                display: params.row['_checked'] ? 'inline-block' : 'none'
              },
              on: {
                click: () => {
                  this.$emit('onClickRemoveGroup', params.row['user_id'])
                }
              }
            }, '移出')
          ])
        }
      })
    }
  },
  data () {
    return {
      selectedUid: 0,
      searchForm: {
        role_id: 0,
        state: 0,
        keywork: ''
      },
      columns: [
        {
          title: '   ',
          key: 'name',
          render: (h, params) => {
            return h('div', [
              h('input', {
                domProps: {
                  type: 'radio',
                  name: '_selected'
                },
                on: {
                  change: (val) => {
                    if (val) {
                      this.selectedUid = params.row.user_id
                    }
                  }
                }
              })
            ])
          }
        },
        {
          title: '姓名',
          key: 'staff_name'
        },
        {
          title: '角色',
          key: 'name'
        },
        {
          title: '手机',
          key: 'staff_tel',
          width: 150
        },
        {
          title: '服务中',
          key: 'name',
          render: (h, params) => {
            return h('span', params.row['staff_all_services'] - params.row['staff_total_services'])
          }
        },
        {
          title: '已完成服务',
          key: 'staff_total_services'
        },
        {
          title: '好评',
          key: 'staff_hp_count'
        },
        {
          title: '中评',
          key: 'staff_zp_count'
        },
        {
          title: '差评',
          key: 'staff_cp_count'
        },
        {
          title: '状态',
          key: 'name',
          render: (h, params) => {
            let state_text
            if (params.row['staff_status'] == 1) {
              state_text = '正常'
            } else if (params.row['staff_pass'] != 1) {
              state_text = '未审核'
            }
            return h('div', [
              h('span', state_text)
            ])
          }
        }
      ],
      data: []
    }
  },
  methods: {
    getStaffOnStore () {
      if (this.store_id) {
        let api = 'store.staff.list' + (this.isSettingMember ? '-member' : '-master')
        this.$http(api, {
          structure_id: this.structureId,
          rows: 30
        }).then(rs => {
          this.data = rs.data
        })
      }
    },
    handleRowClick (row) {
      this.selectedUid = row.user_id
    },
    getSelectedUserIds () {
      const selectedUserId = this.$refs['memberTable'].getSelection()
      let _selected = []
      selectedUserId.forEach(item => {
        _selected.push(item.user_id)
      })
      return _selected
    },
    rowClassName (row, index) {
      console.log(row)
      if (row['_isChecked']) {
        return 'table-selected-row'
      }
      return ''
    }
  }
}
</script>

<style>
.ivu-table .table-selected-row td{
  background-color: #2db7f5;
  color: #fff;
}
</style>
