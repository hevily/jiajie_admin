<template>
  <div>
    <!--<Card>-->
      <!--<p slot="title">-->
        <!--<Icon type="ios-film-outline"></Icon>-->
        <!--订单查询-->
      <!--</p>-->
      <!--<Button slot="extra" type="success" size="small" icon="md-download">导出excel</Button>-->
      <!--&lt;!&ndash;<order-search :orderTypeMap="orderTypeMap" :payWayMap="payWayMap"></order-search>&ndash;&gt;-->
    <!--</Card>-->
    <div style="margin-top: 10px;"></div>
    <Card title="订单列表">
      <div style="font-size: 22px; color: #FF0000; margin-bottom: 5px;">平台总收入: {{total_platform_revenue}} 元</div>
      <Table :stripe="true" size="small" border :columns="orderColumns" :data="orderData" id="mainTable"></Table>
    </Card>
    <div style="margin: 10px 0;overflow: hidden">
      <!--<ButtonGroup style="float: left">-->
        <!--<Button type="default">标记已处理</Button>-->
        <!--<Button type="default">拨打客户手机</Button>-->
      <!--</ButtonGroup>-->
      <div style="float: right;">
        <Page size="small" :total="total" :current="current" :page-size="30" @on-change="changePage"></Page>
      </div>
    </div>
    <Modal
      v-model="toggleCommentModal"
      title="查看评论">
      <comment-item @on-hide="toggleCommentModal = false"></comment-item>
    </Modal>
    <Modal
      :mask-closable="false"
      width="80"
      v-model="toggleActionsModal"
      title="查看订单动作记录">
      <order-actions></order-actions>
      <p slot="footer"></p>
    </Modal>
  </div>
</template>

<script>
import OrderSearch from './components/OrderSearch'
import TableTools from './components/TableTools'
import CommentItem from './CommentItem'
import OrderActions from './components/OrderTrack'

export default {
  name: 'order_list',
  components: {
    OrderSearch,
    TableTools,
    CommentItem,
    OrderActions
  },
  mounted () {
    this.getOrderList()
    this.getOrderPlatformRevenue()
  },
  data () {
    return {
      btnLoading: false,
      toggleActionsModal: false,
      toggleCommentModal: false,
      orderTypeMap: {
        '1': '服务',
        '2': '需求',
        '3': '充值'
      },
      payWayMap: {
        alipay: '支付宝',
        wechat: '微信',
        bankcard: '银联支付'
      },
      orderBisStateMap: {
        SET_UP: '已下单',
        LOCKING: '已锁定',
        PENDING_ORDER: '待接单',
        PENDING_ASSIGN: '待分配',
        PENDING_DOOR: '待上门',
        IN_SERVICE: '服务中',
        PENDING_EVALUATE: '待评价',
        CLOSED: '已关闭',
        COMPLETED: '已完成',
        PENDING_CONTACT: '待定'
      },
      orderPayStateMap: {
        PENDING_PAY: '待支付',
        PAYING: '支付中',
        PAY_SUCCESS: '付款成功',
        REFUND_PROCESSING: '退款中',
        REFUNDED: '已退款'
      },
      orderColumns: [
        {
          width: 35,
          type: 'selection'
        },
        {
          title: '订单号',
          width: 160,
          render: (h, params) => {
            return h('span', params.row.order_detail['order_sn'])
          }
        },
        {
          title: '交易状态',
          // width: 60,
          render: (h, params) => {
            return h('span', this.orderPayStateMap[params.row.order_detail['order_pay_state_dsc']] || params.row.order_detail['order_pay_state_dsc'])
          }
        },
        {
          title: '业务状态',
          // width: 60,
          render: (h, params) => {
            return h('span', this.orderBisStateMap[params.row.order_detail['order_bis_state_dsc']] || params.row.order_detail['order_bis_state_dsc'])
          }
        },
        {
          title: '性质',
          // width: 45,
          render: (h, params) => {
            return h('span', this.orderTypeMap[params.row.store_info['order_type']] || '未知')
          }
        },
        {
          title: '下单手机号',
          // width: 90,
          className: 'non-padding',
          render: (h, params) => {
            return h('span', params.row.server_info['telephone'])
          }
        },
        {
          title: '下单时间',
          // width: 120,
          className: 'non-padding',
          render: (h, params) => {
            return h('span', params.row.time_record['add_time'])
          }
        },
        {
          title: '小计/元',
          // width: 80,
          render: (h, params) => {
            return h('span', params.row.payment['order_amount'])
          }
        },
        {
          title: '实际支付/元',
          // width: 80,
          render: (h, params) => {
            return h('span', params.row.payment['order_actual_amount'])
          }
        },
        {
          title: '操作',
          key: '_action',
          render: (h, params) => {
            return h('div', [
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  disabled: this.btnLoading
                },
                style: {
                  marginRight: '5px',
                  padding: '0 5px',
                  height: '20px'
                },
                on: {
                  click: () => {
                    this.btnLoading = true
                    this.$store.commit('SET_ORDER_SN', params.row.order_detail.order_sn)
                    this.toggleActionsModal = true
                    this.btnLoading = false
                  }
                }
              }, '查看记录'),
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  disabled: this.btnLoading
                },
                style: {
                  padding: '0 5px',
                  height: '20px'
                },
                on: {
                  click: () => {
                    this.btnLoading = true
                    this.$store.commit('SET_ORDER_SN', params.row.order_detail.order_sn)
                    this.$http(`order.get.comment-${params.row.order_detail.order_sn}`).then(rs => {
                      this.$store.commit('SET_ORDER_SN', 0)
                      if (Object.keys(rs.data).length) {
                        this.$store.commit('SET_COMMENT', rs.data)
                        this.toggleCommentModal = true
                        this.btnLoading = false
                      } else {
                        this.$Message.info('暂无评论')
                        this.btnLoading = false
                      }
                    }).catch(() => {
                      this.$store.commit('SET_ORDER_SN', 0)
                    })
                  }
                }
              }, '查看评价')
            ])
          }
        }
      ],
      orderData: [],
      total: 0,
      current: 0,
      total_platform_revenue: 0
    }
  },
  methods: {
    getOrderPlatformRevenue () {
      this.$http('config.get-22').then(rs => {
        this.total_platform_revenue = rs.data['config_value']
      })
    },
    getOrderList (page = 1) {
      this.$http('order.list', {
        rows: 30,
        page
      }).then(rs => {
        this.orderData = rs.data
        this.total = Number(rs.count)
        this.current = rs.append.page.current
      })
    },
    changePage (page) {
      this.getOrderList(page)
    }
  }
}
</script>

<style>
#mainTable .ivu-table-cell,
#mainTable td
{
  padding: 1px !important;
  height: 25px;
  line-height: 25px;
  text-align: center;
}
#mainTable th {
  height: 25px;
  line-height: 25px;
  text-align: center;
}
</style>
