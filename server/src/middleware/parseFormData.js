const parseFormData = (req, res, next) => {
  // Parse JSON strings in form-data
  const fieldsToParseAsJSON = ['sizes'];
  
  fieldsToParseAsJSON.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        // If JSON parsing fails for sizes, try to split by comma
        if (field === 'sizes') {
          req.body[field] = req.body[field].split(',').map(size => size.trim().replace(/['"]/g, ''));
        }
      }
    }
  });
  
  next();
};

module.exports = parseFormData;