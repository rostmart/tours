class APIFeatures {
  constructor(query, queryString) { //query - mongoose query; queryString - we get it from express (from the route)
  this.query = query;
  this.queryString = queryString;
  }
  filter() {
    const queryObj = {...this.queryString}//creating a hard copy object. In case of const queryObj =  this.queryString - gives a reference
    // to an obj but we need a copy; ...-destructuring (copies all fields from  this.queryString object), {} - creates a new object
    const excludedFields = ['page', 'sort', 'limit', 'fields'];//an array of excluded parameters
    excludedFields.forEach(el => delete queryObj[el]);
    //console.log(req.query, queryObj);//logs filtering options from postman

    //1b) Advanced filtering (implementing gte(grater than), gt, lte, lt). We need to add $ sign to each because
    // mongodb understands only with $ sign
    let queryStr = JSON.stringify(queryObj);//converting queryObj to string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);//regular expression: \b - expression must match the
                                                                              // exact word (gte or lt etc); /g - replace more than 1
                                                                              //or more matches; match => `$${match}` - callback function,
                                                                              //which replaces any of matches with the same word with $ usign
                                                                              //in front of it
    this.query.find(JSON.parse(queryStr))//converts string back to object
    //console.log(JSON.parse(queryStr));
    return this;// returns the whole obj, which allos to chain different
                // functions to const features = new APIFeatures(Tour.find(), req.query).differentFunctions

  }

  sort() {
    if (this.queryString.sort) { //in case there is sort keyword in url
    const sortBy = this.queryString.sort.split(',').join(' ');//converts a string with commas from url
                                                       //(postman:27.0.0.1:3000/api/v1/tours?sort=price,ratingsAverage)
                                                       //to a string with space symbols
    this.query = this.query.sort(sortBy);
    } else {
    this.query = this.query.sort('-createdAt');//sorts by default(without using sort method at all) and returns
                                               //results sorted by creation date
    }
    return this;// returns the whole obj, which allos to chain different
                // functions to const features = new APIFeatures(Tour.find(), req.query).differentFunctions
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
     } else {
       this.query = this.query.select('-__v')//excludes __v from the output
     }
     return this;// returns the whole obj, which allos to chain different
                 // functions to const features = new APIFeatures(Tour.find(), req.query).differentFunctions
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;//req.query.page * 1 - in case there is page keyword in url;
                                         //* 1 - converts to int;
                                         //|| 1 - in case nothing specified in url page = 1 is default
    const limit = this.queryString.limit * 1 || 100;//req.query.page * 1 - in case there is limit keyword in url;
                                             ////* 1 - converts to int;
                                             //|| 100 - in case nothing specified in url limit = 100 is default
    const skip = (page - 1) * limit//formula for pagination(limit results per page)
    this.query = this.query.skip(skip).limit(limit);//.skip(skip).limit(limit) - shows limit results, starting
                                          //from (page - 1) * limit
    return this;// returns the whole obj, which allos to chain different
                // functions to const features = new APIFeatures(Tour.find(), req.query).differentFunctions
  }
}

module.exports = APIFeatures;
