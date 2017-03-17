// Add a prototype first function to array
Array.prototype.first = function() {
  return this[0];
};

// Add a prototype last function to array
Array.prototype.last = function() {
  return this[this.length - 1];
};

// Add a prototype includes function to array
Array.prototype.includes = function(item) {
  if (item === undefined) {
    return false;
  }
  return (this.indexOf(item) > -1);
};

// Add a prototype hasDuplicates function to array
Array.prototype.hasDuplicates = function() {
  var valuesSoFar = [];
  for (var i = 0; i < this.length; ++i) {
    var value = this[i];
    if (valuesSoFar.indexOf(value) !== -1) {
      return true;
    }
    valuesSoFar.push(value);
  }
  return false;

  // ES2015 Environment
  // return (new Set(this)).size !== this.length;
};

// Add a prototype unique function to array
Array.prototype.unique = function() {
  var uniqueArray = this.filter(function(item, pos, self) {
    return self.indexOf(item) === pos;
  });
  return uniqueArray;
};

// Add a prototype compact function to array
Array.prototype.compact = function() {
  var compactArray = this.filter(function(item, pos, self) {
    if (item !== null && item !== undefined)
      return true;
    return false;
  });
  return compactArray;
};
