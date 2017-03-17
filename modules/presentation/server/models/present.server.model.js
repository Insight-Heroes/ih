'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Present Schema
 */
var PresentSchema = new Schema({
  storyboardName: {
    type: String,
    default: '',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  lastOpenedOn: {
    type: Date,
    default: Date.now
  },
  project: {
    type: Schema.ObjectId,
    ref: 'Project'
  },
  survey: {
    type: Schema.ObjectId,
    ref: 'Survey'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  slides: {
    type: String
  },
  graphs: [{
    createdOn: {
      type: Date,
      default: Date.now
    },
    slideNo: {
      type: Number
    },
    graphMode: {
      type: String,
      default: ''
    },
    chartType: {
      type: String,
      default: ''
    },
    surveyId: {
      type: String
    },
    slideTitle: {
      type: String,
      default: '',
      trim: true
    },
    graphTitle: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    relationship: {
      type: String,
      default: '',
      trim: true
    },
    labels: [{
      type: String
    }],
    series: [{
      type: String
    }],
    seriesData: {
      type: Boolean,
      default: false
    },
    statsType: {
      type: String,
      enum: ['percentile', 'count'],
      default: 'count'
    },
    data: [],
    percentData: [],
    graphOptions: {
      scales: {
        xAxes: [{
          stacked: {
          type: Boolean,
          default: true
        },
          ticks: {
            beginAtZero: {
              type: Boolean,
              default: true
            }
          }
        }],
        yAxes: [{
          stacked: {
          type: Boolean,
          default: true
        },
          ticks: {
            beginAtZero: {
              type: Boolean,
              default: true
            }
          }
        }]
      },
      legend: {
        display: {
          type: Boolean,
          default: false
        }
      }
    },
    question: [{
      type: Schema.ObjectId,
      ref: 'Question'
    }],
    varName: [{
      type: String,
      default: ''
    }],
    sampleSize: {
      type: Number
    },
    count: {
      type: Number
    },
    average: {
      type: Number
    },
    median: {
      type: Number
    },
    mode: {
      type: Number
    },
    standardDeviation: {
      type: Number
    },
    minimum: {
      type: Number
    },
    maximum: {
      type: Number
    }
  }]
});

mongoose.model('Present', PresentSchema);
