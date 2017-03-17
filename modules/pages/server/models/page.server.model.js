'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  Schema = mongoose.Schema;

var utils = require(path.resolve('./modules/core/server/utilities/utils.server'));

/**
 * Page Schema
 */
var PageSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    required: 'Title can not be blank'
  },
  description: {
    type: String
  },
  inQuestions: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    default: 0
  },
  survey: {
    type: Schema.ObjectId,
    ref: 'Survey',
    required: 'Survey can not be blank'
  },
  slug: {
    type: String,
    required: 'Page type can not be blank'
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
  }]
});

PageSchema.index({ survey: 1 });

/**
 * Hook a pre validate method to move temporary file url
 * from mediaFiles to tmpMediaFiles
 */
PageSchema.pre('validate', function (next) {
  if (this.slug === 'welcome') {
    this.position = -1;
  } else if (this.slug === 'thankYou') {
    this.position = 999;
  }
  var properFiles = [],
    tmpFiles = this.tmpMediaFiles;
  this.mediaFiles.forEach(function(f) {
    if (f.tmpUrl) {
      tmpFiles.push({ url: f.tmpUrl, name: f.name });
    } else if (f.url) {
      properFiles.push(f);
    }
  });
  this.mediaFiles = properFiles;
  this.tmpMediaFiles = tmpFiles;
  next();
});

mongoose.model('Page', PageSchema);
