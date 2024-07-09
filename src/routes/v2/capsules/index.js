import dayjs from 'dayjs';
import Router from 'koa-router'
import _ from 'lodash'


const route = new Router();

route.get('/', async ({ models, response, request }) => {
  const hql = request.paging();
  hql.sort = { createdAt: -1 };
  hql.lean = true;
  hql.where = _.pick(request.query, ['receiver', 'name']);
  if (request.query.date) {
    const start = dayjs(request.query.date).startOf('day').toDate();
    const end = dayjs(start).endOf('day').toDate();
    hql.where.createdAt = { $gt: start, $lt: end };
  }
  const items = await models.Capsule.getList(hql);
  response.success({ items });
})

route.get('/:id', async ({ params, models, response }) => {
  const where = { _id: params.id };
  const item = await models.Capsule.getInfo({ where, lean: true });
  if (item) {
    response.success(item);
  } else {
    response.fail({ message: '未找到' })
  }
})

route.post('/', async ({ request, response, models }) => {
  const data = _.pick(request.body, ['name', 'receiver', 'desc', 'content', 'createdAt', 'expiredAt']);
  data.createdAt = new Date();
  if (dayjs(data.expiredAt).isBefore(data.createdAt)) {
    return response.fail({ message: '打开时间不能是过去的时间' })
  }
  const item = await models.Capsule.create(data);
  response.success({ id: item._id });
});

export default route