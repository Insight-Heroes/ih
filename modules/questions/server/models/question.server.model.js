'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  _ = require('lodash'),
  Schema = mongoose.Schema;

var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

function validateQuestionType(questionType) {
  if (utils.questionTypes(true).indexOf(questionType) < 0) {
    return false;
  } else {
    return true;
  }
}

function isValidUrl(url) {
    var retVal = {};
    var matches;
    var base = 'v';
    if (url === '' || url === null)
    return true;
    if (url.indexOf('youtube.com/watch') !== -1) {
        retVal.provider = 'youtube';
        var re = new RegExp('(\\?|&)' + base + '\\=([^&]*)(&|$)');
        matches = url.match(re);
        if (matches)
            retVal.id = matches[2];
        else
            retVal.id = '';
    } else if (url.indexOf('youtu.be') !== -1) {
        retVal.provider = 'youtube';
        matches = url.match(/youtu.be\/([^&]*)(&|$)/);
        if (matches)
            retVal.id = matches[1];
        else
            retVal.id = '';
    } else if (url.indexOf('https://vimeo.com/') !== -1) {
        retVal.provider = 'vimeo';
        matches = url.match(/vimeo.com\/(\d+)/);
        if (matches)
            retVal.id = matches[1];
        else
            retVal.id = '';
    }
    if ((retVal.provider === 'youtube' || retVal.provider === 'vimeo') && retVal.id !== '' || url === '')
    return true;
    else
    return false;
}

/**
 * Question Schema
 */
var QuestionSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  questionType: {
    type: String,
    trim: true,
    required: 'Question type cannot be blank',
    validate: [validateQuestionType, 'Invalid question type']
  },
  title: {
    type: String,
    trim: true,
    required: 'Question title cannot be blank'
  },
  description: {
    type: String,
    trim: true
  },
  mediaFiles: [{
    url: {
      type: String,
      trim: true,
      required: 'File url can not be blank'
    },
    position: {
      type: Number
    },
    tmpUrl: {
      type: String
    },
    name: {
      type: String,
      trim: true
    },
    slug: {
      type: String
    }
  }],
  tmpMediaFiles: [{
    url: {
      type: String,
      trim: true,
      required: 'Temporary image url can not be blank'
    },
    name: {
      type: String,
      trim: true
    }
  }],
  choices: [
    {
      text: {
        type: String,
        trim: true,
        required: 'Choice text can not be blank'
      },
      slug: {
        type: String
      },
      position: {
        type: Number,
        required: 'Choice position can not be blank'
      }
    }
  ],

  // left Choices, randomizeLeft, right Choices & randomizeRight are for pairing question
  leftChoices: [
    {
      text: {
        type: String,
        trim: true,
        required: 'Choice text can not be blank'
      },
      slug: {
        type: String
      },
      position: {
        type: Number,
        required: 'Choice position can not be blank'
      }
    }
  ],
  randomizeLeft: {
    type: Boolean,
    default: false
  },
  rightChoices: [
    {
      text: {
        type: String,
        trim: true,
        required: 'Choice text can not be blank'
      },
      slug: {
        type: String
      },
      position: {
        type: Number,
        required: 'Choice position can not be blank'
      }
    }
  ],
  randomizeRight: {
    type: Boolean,
    default: false
  },

  // rows & columns are for matrix question
  rows: [{
      text: {
        type: String,
        trim: true,
        required: 'Row text can not be blank'
      },
      slug: {
        type: String
      },
      position: {
        type: Number,
        required: 'Row position can not be blank'
      }
    }
  ],
  columns: [{
      text: {
        type: String,
        trim: true,
        required: 'Column text can not be blank'
      },
      slug: {
        type: String
      },
      position: {
        type: Number,
        required: 'Column position can not be blank'
      }
    }
  ],

  // isCompulsary, alignVertically, randomizeOrder, radioButtons options for mutichoice question
  isCompulsary: {
    type: Boolean,
    default: false
  },
  alignVertically: {
    type: Boolean,
    default: false
  },
  randomizeOrder: {
    type: Boolean,
    default: false
  },
  radioButtons: {
    type: Boolean
  },

  // Time & Date question
  timeDate: {
    type: {
      type: String
    },
    timeOptions: {
      hourStep: {
        type: Number
      },
      minuteStep: {
        type: Number
      },
      amPm: {
        type: Boolean,
        default: false
      }
    },
    dateOptions: {
      minDate: {
        type: String
      },
      maxDate: {
        type: String
      },
      futureDates: {
        type: Boolean,
        default: false
      },
      pastDates: {
        type: Boolean,
        default: false
      }
    }
  },
  survey: {
    type: Schema.ObjectId,
    ref: 'Survey',
    required: 'Survey cannot be blank'
  },
  position: {
    type: Number
  },
  logicJumps: [{
    type: Schema.ObjectId,
    ref: 'LogicJump'
  }],
  videoUrl: {
    type: String,
    default: null,
    validate: [isValidUrl, 'Please enter Youtube / Vimeo Url']
  },
  varName: {
    type: String
  },
  slugHistory: {
    type: Object
  }
});

QuestionSchema.index({ survey: 1 });

/**
 * Hook a pre validate method to move temporary file url
 * from mediaFiles to tmpMediaFiles
 */

QuestionSchema.pre('validate', function (next) {
  var self = this;
  var properFiles = [];
  var tmpFiles = self.tmpMediaFiles;

  self.mediaFiles.forEach(function(f) {
    if (f.tmpUrl) {
      tmpFiles.push({ url: f.tmpUrl, name: f.name });
    } else if (f.url) {
      properFiles.push(f);
    }
  });
  self.mediaFiles = properFiles;
  self.tmpMediaFiles = tmpFiles;
  next();
});

QuestionSchema.pre('save', function (next) {
  var self = this;
  if (_.includes(['multiChoice', 'dropdown', 'slider', 'rankOrder'], self.questionType)) {
    setSlugForChoices(self);
  } else if (self.questionType === 'imageChoice') {
    setSlugForImageUrls(self);
  } else if (self.questionType === 'matrix') {
    setSlugForRowCols(self);
  } else if (self.questionType === 'pairing') {
    setSlugForPairs(self);
  }
  updateSlugHistory(self);
  console.log('Question: %s\tSlugs:', _.truncate(self.questionType, { length: 11 }), self.slugHistory);
  next();
});

mongoose.model('Question', QuestionSchema);

/**
 * Set Slug for Multichoice, Dropdown, Rank Order & Slider questions
 * @param {Object} q - question obejct
 */
function setSlugForChoices(q) {
  if (_.size(_.values(q.slugHistory)) === 0) {
    q.slugHistory = {};
    setNewSlugs(q, 'choices', 'text', 'ch');
  } else {
    fetchSlugFromHistory(q, 'choices', 'text', 'ch');
  }
}

/**
 * Set Slug for Imagechoice question
 * @param {Object} q - question obejct
 */
function setSlugForImageUrls(q) {
  if (_.size(_.values(q.slugHistory)) === 0) {
    q.slugHistory = {};
    setNewSlugs(q, 'mediaFiles', 'url', 'img');
  } else {
    fetchSlugFromHistory(q, 'mediaFiles', 'url', 'img');
  }
}

/**
 * Set Slug for Matrix question
 * @param {Object} q - question obejct
 */
function setSlugForRowCols(q) {
  if (_.size(_.values(q.slugHistory)) === 0) {
    q.slugHistory = {};
    setNewSlugs(q, 'rows', 'text', 'r');
    setNewSlugs(q, 'columns', 'text', 'c');
  } else {
    fetchSlugFromHistory(q, 'rows', 'text', 'r');
    fetchSlugFromHistory(q, 'columns', 'text', 'c');
  }
}

/**
 * Set Slug for Pairing question
 * @param {Object} q - question obejct
 */
function setSlugForPairs(q) {
  if (_.size(_.values(q.slugHistory)) === 0) {
    q.slugHistory = {};
    setNewSlugs(q, 'leftChoices', 'text', 'l');
    setNewSlugs(q, 'rightChoices', 'text', 'r');
  } else {
    fetchSlugFromHistory(q, 'leftChoices', 'text', 'l');
    fetchSlugFromHistory(q, 'rightChoices', 'text', 'r');
  }
}

/**
 * Find slug associated with text from slug history
 * @param  {String} text - text to be searched in slugHistory
 * @param  {Object} slugHistory Slug History object
 */
function getSlugFromHistory(text, slugHistory) {
  var slug = '';
  _.forEach(slugHistory, function(value, s) {
    if (value === _.trim(text)) {
      slug = s;
    }
  });
  return slug;
}

/**
 * Generate new slug for each choices/mediaFiles/rows/cols/leftChoices/rightChoices
 * @param {Object} q        Question instance
 * @param {String} property - Question attribute, it can be choices, mediaFiles, rows, cols, leftChoices, rightChoices
 * @param {String} attr     Internal attribute name from above array (from choices, mediaFiles, rows, cols, leftChoices, rightChoices)
 * @param {String} slugStart  -  Starting String for slug
 */
function setNewSlugs(q, property, attr, slugStart) {
  q[property].forEach(function(c, i) {
    var slug = slugStart + _.size(q.slugHistory);
    c.slug = slug;
    q.slugHistory[slug] = c[attr];
  });
}

/**
 * Assign slug to choices/mediaFiles/rows/cols/leftChoices/rightChoices from histpry, if slug not present, generate new one
 * @param {Object} q        Question instance
 * @param {String} property - Question attribute, it can be choices, mediaFiles, rows, cols, leftChoices, rightChoices
 * @param {String} attr     Internal attribute name from above array (from choices, mediaFiles, rows, cols, leftChoices, rightChoices)
 * @param {String} slugStart  -  Starting String for slug
 */
function fetchSlugFromHistory(q, property, attr, slugStart) {
  q[property].forEach(function(c, i) {
    var slug;
    // Slug found
    if (_.includes(_.values(q.slugHistory), _.trim(c[attr]))) {
      slug = getSlugFromHistory(c[attr], q.slugHistory);
      c.slug = slug;
    } else {
      slug = slugStart + _.size(q.slugHistory);
      c.slug = slug;
      q.slugHistory[slug] = _.trim(c[attr]);
    }
  });
}

/**
 * Assign new slug history to question
 * @param  {Object} self - Question instance
 */
function updateSlugHistory(self) {
  var newSlugHistory = _.clone(self.slugHistory);
  self.slugHistory = {};
  self.slugHistory = newSlugHistory;
}
