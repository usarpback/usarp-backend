async function paginate(model, page = 1, pageSize = 10, options = {}) {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const { count, rows } = await model.findAndCountAll({
    ...options,
    limit,
    offset,
  });

  return {
    data: rows,
    meta: {
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  };
}

module.exports = paginate;
