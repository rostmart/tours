module.exports = fn => { //Lesson 115
  return (req, res, next) => {
    fn(req, res,next).catch(next);
  };
};
