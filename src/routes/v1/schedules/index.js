import Router from 'koa-router'
import Scheduler from '#utils/scheduler.js';

const router = new Router({
  prefix: '',
});

router.get('/', async ({ models, scheduler, config, state, request, response }) => {
  const docs = await models.Schedule.getAll({ lean: true });
  const results = docs.map(doc => {
    const task = Scheduler.tasks[doc._id];
    const v = { isActive: false, isRunning: false, ...doc };
    if (task) {
      v.isActive = Scheduler.isActive(doc._id);
      v.isRunning = Scheduler.isRunning(doc._id);
    }
    return v;
  })
  response.success({ items: results });
});

router.post('/', async ({ models, request, response }) => {
  const doc = await models.Schedule.create(request.body);
  response.success(doc);
});

router.put('/:_id', async (ctx) => {
  const { params, models, request, response } = ctx;
  const where = { _id: params._id };
  await models.Schedule.update({ where, data: { $set: request.body } });
  const task = await models.Schedule.getInfo({ where, lean: true });
  if (task) {
    Scheduler.load(task, ctx)
  }
  response.success();
});

router.post('/:_id/status', async ({ params, models, request, response }) => {
  const where = { _id: params._id };
  await models.Schedule.update({ where, data: { $set: request.body } });
  if (request.body.status === 1) {
    Scheduler.stop(params._id);
  } else if (request.body.status === 2) {
    Scheduler.start(params._id);
  }
  response.success();
});

router.patch('/:_id', async (ctx) => {
  try {
    if (Scheduler.isActive(ctx.params._id)) {
      const ok = Scheduler.tick(ctx.params._id);
      return ok ? ctx.response.success() : ctx.response.fail({ message: '任务正在运行' })
    } else {
      return ctx.response.fail({ message: '任务不可运行' })
    }
  } catch (e) {
    ctx.response.fail(e);
  }
});


export default router