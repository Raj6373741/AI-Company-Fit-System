exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.redirect("/");
    }
    next();
  };
};