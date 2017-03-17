'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  Present = mongoose.model('Present'),
  Comment = mongoose.model('Comment'),
  pdfMailer = require(path.resolve('./modules/presentation/server/controllers/presents.pdf-mail.server.controller')),
  Survey = mongoose.model('Survey'),
  Question = mongoose.model('Question'),
  async = require('async'),
  shortid = require('shortid'),
  parameters = require('strong-params').Parameters,
  pdf = require('html-pdf'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/* present parameters */
/* function presentParams(rawParams) {
    var params = parameters(rawParams);
    return params.permit({ graphs: ['slideNo', 'chartType', 'description', 'relationship', { labels: [] }, { series: [] }, 'seriesData', 'statsType', { data: [] }, { percentData: [] }, 'graphOptions', 'question', 'sampleSize', 'count', 'average', 'median', 'confidenceInterval', 'standardDeviation', 'minimum', 'maximum']
  }).value();
} */

/**
 * Create a Present
 */
exports.create = function(req, res) {
  var newGraphs = req.body;
  Survey.findOne({
    _id: newGraphs[0].surveyId
  }, null, function(err, survey) {
    Present.find({ 'survey': survey._id, 'user': req.user.parentId() }).exec(function (err, p) {
      if (err) {
        console.log('error occured');
        return res.status(404).send({
          message: 'No Present with that identifier has been found'
        });
      } else if (p.length) {
        var oldPresent;
        var updatedPresent = {};
        updatedPresent.graphs = newGraphs;
        // console.log('present in present model : ', p[0]._id);

        Present.findById(p[0]._id).exec(function (err, present) {
          if (err) {
            return res.status(404).send({
              message: 'No Present with that identifier has been found'
            });
          }
          oldPresent = present;
          updatedPresent.slides = parseInt(oldPresent.slides, 10) + parseInt(updatedPresent.graphs.length, 10);
          var countr = parseInt(oldPresent.slides, 10) + 1;
          for (var j = 0; j < updatedPresent.graphs.length; j++) {
            updatedPresent.graphs[j].slideNo = countr;
            updatedPresent.graphs[j].description = survey.description;
            updatedPresent.graphs[j].slideTitle = survey.name;
            if (updatedPresent.graphs[j].graphMode === 'tab') {
                updatedPresent.graphs[j].graphTitle = 'Tabulation of ' + updatedPresent.graphs[j].varName[0];
            } else if (updatedPresent.graphs[j].graphMode === 'crossTab' && updatedPresent.graphs[j].varName.length === 2) {
                updatedPresent.graphs[j].graphTitle = 'Cross Tabulation of ' + updatedPresent.graphs[j].varName[0] + ' WITH ' + updatedPresent.graphs[j].varName[1];
            } else {
                updatedPresent.graphs[j].graphTitle = 'Cross Tabulation of ' + updatedPresent.graphs[j].varName[0] + ' WITH ' + updatedPresent.graphs[j].varName[1] + ' AND ' + updatedPresent.graphs[j].varName[2];
            }
            oldPresent.graphs.push(updatedPresent.graphs[j]);
            countr += 1;
          }
            oldPresent.slides = updatedPresent.slides;
              oldPresent.save(function(err) {
                if (err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  console.log('updatedPresent after save: ', oldPresent);
                  res.jsonp(oldPresent);
                }
              });
        });
      } else {
          var counter = 1;
          var present = new Present();
          present.graphs = newGraphs;
          present.user = req.user.parentId();
          present.slides = present.graphs.length;
          present.storyboardName = survey.name;
          present.survey = survey;
          present.project = survey.project;

          for (var i = 0; i < present.graphs.length; i++) {
            present.graphs[i].slideNo = counter;
            present.graphs[i].slideTitle = survey.name;
            if (present.graphs[i].graphMode === 'tab') {
                present.graphs[i].graphTitle = 'Tabulation of ' + present.graphs[i].varName[0];
            } else if (present.graphs[i].graphMode === 'crossTab' && present.graphs[i].varName.length === 2) {
                present.graphs[i].graphTitle = 'Cross Tabulation of ' + present.graphs[i].varName[0] + ' WITH ' + present.graphs[i].varName[1];
            } else {
                present.graphs[i].graphTitle = 'Cross Tabulation of ' + present.graphs[i].varName[0] + ' WITH ' + present.graphs[i].varName[1] + ' AND ' + present.graphs[i].varName[2];
            }
            present.graphs[i].description = survey.description;
            counter += 1;
          }
          present.save(function(err) {
            if (err) {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            } else {
              console.log('present after save: ', present);
              res.jsonp(present);
            }
          });
      }
    });
  });
};

/**
 * Show the current Present
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var present = req.present ? req.present : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  present.isCurrentUserOwner = req.user && present.user && present.user._id.toString() === req.user._id.toString();
  present.lastOpenedOn = Date.now();
  present.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(present);
    }
  });
};

/**
 * Show the Present for current survey on present tab
 */
exports.readPresentBySurvey = function(req, res) {
    var params = { user: req.user.parentId() };
    params.survey = req.params.surveyId;
    Present.find(params).sort('-created').populate('user survey').exec(function(err, present) {
    if (err) {
      console.log('err : ', err);
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(present);
    }
});
};

/**
 * Update a slideTitle, description, graphTitle
 */
exports.update = function(req, res) {
  var present = req.present;
  var updatedPresent = {};
  updatedPresent = req.body;
  present.graphs.forEach(function(graph) {
    if (graph._id.toString() === updatedPresent.graphs._id) {
      for (var key in updatedPresent.graphs) {
          if (updatedPresent.graphs.hasOwnProperty(key))
              graph[key] = updatedPresent.graphs[key];
      }
    }
  });
  present.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(present);
    }
  });
};

/**
 * Update a slide positions
 */
exports.updateSlidePosition = function(req, res) {
  var present = req.present;
  var updatedPresent = req.body; // array of graphid and slideNo

  // present.graphs.forEach(function(graph) {
  //   console.log('-------Before------', graph._id, graph.slideNo);
  // });

  // console.log('------ UpdateTo -----', updatedPresent);

  present.graphs.forEach(function(graph) {
    updatedPresent.forEach(function(updatedGraph) {
        if (graph._id.toString() === updatedGraph.graphId.toString()) {
            // console.log('before', graph._id, graph.slideNo);
            graph.slideNo = updatedGraph.slideNo;
            // console.log('After', graph._id, graph.slideNo);
        }
    });
  });

  // present.graphs.forEach(function(graph) {
  //   console.log('-------After------', graph._id, graph.slideNo);
  // });

  present.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(present);
    }
  });
};

/**
 * Delete an Present
 */
exports.delete = function(req, res) {
  var present = req.present;

  present.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(present);
    }
  });
};

/**
 * Delete an Graph inside Present
 */
exports.deleteGraph = function(req, res) {
  var present = req.present;
  var graphId = req.params.graphId;

  present.graphs.forEach(function(graph, index) {
    if (graph._id.toString() === graphId) {
      console.log('graph to be deleted : ', present.graphs[index]);
        Comment.remove({ graphId: graphId }, function(err, comments) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
        });
        present.graphs.splice(index, 1);
        present.slides = present.graphs.length;
        present.graphs.forEach(function(graph, index) {
           graph.slideNo = index + 1;
        });
    }
  });
  present.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(present);
    }
  });
};

/**
 * List of Presents
 */
exports.list = function(req, res) {
  var params = { user: req.user.parentId() };
  console.log(req.user.roles, _.includes(['warrior', 'client'], req.user.roles));
  // console.log('req.user.permissions.allowedProjects : ', req.user.permissions.allowedProjects);
    if (req.user.user && _.includes(['warrior', 'client'], req.user.roles)) {
        if (req.user.permissions && req.user.permissions.allowedProjects.length > 0) {
            params.project = { $in: req.user.permissions.allowedProjects };
        } else {
            return res.json([]);
        }
    }
  Present.find(params).sort('-created').populate('user survey').exec(function(err, presents) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(presents);
    }
  });
};

/**
 * Present middleware
 */
exports.presentByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Present is invalid'
    });
  }

  Present.findById(id).populate('user survey project').exec(function (err, present) {
    if (err) {
      return next(err);
    } else if (!present) {
      return res.status(404).send({
        message: 'No Present with that identifier has been found'
      });
    }
    req.present = present;
    next();
  });
};

exports.generatePdf = function(req, res, next) {
    var presentId = req.params.presentId;
    // var slideNo = req.params.slideNo;
    var user = req.user;
    var present = req.present;
    var label = [];
    var graphType = [];
    var data;
    var fileName = user._id + shortid.generate() + '.pdf';
    var graphDataObjArr = [];
    var options = [{}];

    // console.log('present : ', present);
    present.graphs = _.orderBy(present.graphs, ['slideNo'], ['asc']);

    for (var i = 0; i < present.graphs.length; i++) {
      var graphDataObj = {
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
        }],
        labels: []
      };
      graphType[i] = present.graphs[i].chartType;
      label = present.graphs[i].series;
      graphDataObj.labels = present.graphs[i].labels.map(function(l) {
                              return l.substr(0, 25);
                            });
      console.log('graphDataObj.labels :', graphDataObj.labels);
      graphDataObj.slideTitle = present.graphs[i].slideTitle;
      graphDataObj.graphTitle = present.graphs[i].graphTitle;
      graphDataObj.description = present.graphs[i].description;
      graphDataObj.slideNo = present.graphs[i].slideNo;
      graphDataObj.createdOn = present.graphs[i].createdOn;
      if (present.graphs[i].statsType === 'count') {
        graphDataObj.datasets = generateDatasetForChart(present.graphs[i].data, graphType[i]);
      } else {
        graphDataObj.datasets = generateDatasetForChart(present.graphs[i].percentData, graphType[i]);
      }
      if (present.graphs[i].seriesData) {
        options[i] = {
                    responsive: false,
                    animation: false,
                    width: 400,
                    height: 400,
                    scales: {
                      yAxes: [{
                          stacked: true,
                          ticks: {
                              beginAtZero: true
                          }
                      }],
                      xAxes: [{
                          stacked: true,
                          ticks: {
                              beginAtZero: true
                          }
                      }]
                    },
                    legend: {
                      display: true
                    }
                  };
      } else {
        options[i] = {
                    responsive: false,
                    animation: false,
                    width: 400,
                    height: 400,
                    scales: {
                      yAxes: [{
                          stacked: true,
                          ticks: {
                              beginAtZero: true
                          }
                      }],
                      xAxes: [{
                          stacked: true,
                          ticks: {
                              beginAtZero: true
                          }
                      }]
                    },
                    legend: {
                      display: false
                    }
                  };
      }
      graphDataObjArr.push(graphDataObj);
    }

    console.log('==============================================');
    console.log('graphDataObjArr : ', graphDataObjArr);
    console.log('==============================================');

    var httpTransport = 'http:';
    if (config.secure && config.secure.ssl === true) {
        httpTransport = 'https:';
    }

    async.waterfall([
    function (done) {
        var pdfHTML = '';
        var chartDetailArr = [];
        for (var i = 0; i < present.graphs.length; i++) {
          var jObj = {
                type: graphType[i],
                data: graphDataObjArr[i],
                options: options[i]
            };
          chartDetailArr[i] = jObj;
        }

        chartDetailArr = JSON.stringify(chartDetailArr);
        // console.log('----------newobj chartDetailArr-----> ', chartDetailArr);
        res.render(path.resolve('modules/presentation/server/templates/graphs'), {
            charttype: graphType,
            details: chartDetailArr,
            protocol: httpTransport,
            host: req.headers.host
        }, function (err, pdfHTML) {
            done(err, pdfHTML);
        });
    },
    function (pdfHTML, done) {
        // console.log(pdfHTML);
        var configs = {
            'type': 'pdf',
            'format': 'Letter',
            'timeout': 5000,
            'quality': '100',
            'phantomArgs': ['--ignore-ssl-errors=yes'],
            'header': {
              'height': '10mm'
              // 'contents': '<div style="text-align: center;"> Storyboard Name: ' + present.storyboardName + '</div>'
            },
            'footer': {
              'height': '8mm',
              'contents': {
                // first: 'Cover page',
                // 2: 'Second page', // Any page number is working. 1-based index
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>'
                // last: 'Last Page'
              }
            },
            'border': {
              'top': '0.5in',            // default is 0, units: mm, cm, in, px
              'right': '0.5in',
              'bottom': '0.5in',
              'left': '1in'
            }
        };

        /* ------- to check html uncomment bellow code and run url in browser -----------*/
        // http://0.0.0.0:4000/api/presentation/pdf/589c11b12df72b081a71bf49
        // in routes, change request method to `get` instead of `post`

        // res.writeHead(200, {
        //   'Content-Type': 'text/html',
        //   'Content-Length': pdfHTML.length,
        //   'Expires': new Date().toUTCString()
        // });
        // res.end(pdfHTML);
        // pdfHTML = false;
        // return false;

        /* ------- to check html uncomment above code -----------*/

        if (pdfHTML) {
            pdf.create(pdfHTML, configs).toStream(function(err, stream) {
              if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    console.log('stream : ', stream);
                    var resp = stream.pipe(fs.createWriteStream('./public/pdf/' + fileName));
                    resp.on('finish', function() {
                        done();
                    });
                }
            });
        } else {
            done(null);
        }
    }
    ], function (err, resp) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            pdfMailer.deliverEmail(req, res, next, user, fileName, true, function(err, result) {
              if (err) {
                console.log('inside pdf mail err : ', err);
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                fs.unlink('./public/pdf/' + fileName, function(err) {
                  if (err) {
                    return console.error(err);
                  }
                  console.log('File deleted successfully!');
                  res.json({ msg: 'Email sent successfully' });
                });
              }
            });
        }
    });

    function generateDatasetForChart(data, graphType) {
      // var colorArr = ['rgba(151,187,205,1)', 'rgba(220,220,220,1)', 'rgba(247,70,74,1)', 'rgba(70,191,189,1)', 'rgba(253,180,92,1)', 'rgba(148,159,177,1)', 'rgba(77,83,96,1)'];
      // var borderColorArr = ['rgba(151,187,205,1.8)', 'rgba(220,220,220,1.8)', 'rgba(247,70,74,1.8)', 'rgba(70,191,189,1.8)', 'rgba(253,180,92,1.8)', 'rgba(148,159,177,1.8)', 'rgba(77,83,96,1.8)'];
      var chartColors = [
                '#0766EF',
                '#FB2355',
                '#71BEF4',
                '#360696',
                '#D0579A',
                '#99092A',
                '#D5A7E6',
                '#FFD86E',
                '#65CACA',
                '#032F98',
                '#18AFC4',
                '#F4E66D',
                '#1BB7B8',
                '#6AF7OD',
                '#FF8AA3',
                '#F75A73',
                '#FEDO9O',
                '#FFC42F',
                '#FF135F',
                '#6FAAFF',
                '#43F165',
                '#FFD86E',
                '#5E65D8',
                '#C78EE1',
                '#658AED',
                '#7B4FB3',
                '#11E9DE'
            ];
      /* labels.forEach(function() {
          // var letters = '0123456789ABCDEF'.split('');
          var color;
          color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
          colorArr.push(color);
      }); */

      // Data is empty OR Data is for simple Charts (Numbers in array)
      /* if ((data.length === 0) || (typeof data[0] === 'string')) {
        return [{
          data: data,
          // label:
          backgroundColor: colorArr,
          borderColor: borderColorArr
        }];
      } */

      var formattedData = [];
      // If data array contains array
      if (typeof data[0] === 'object') {
        for (var i = 0; i < data.length; i++) {
          formattedData.push({
            data: data[i],
            label: label[i],
            backgroundColor: chartColors[i]
            // borderColor: borderColorArr[i]
          });
        }
        return formattedData;
      } else {
        // Data is for simple Charts (Numbers in array)
        if (graphType === 'line') {
          return [{
            data: data,
            backgroundColor: chartColors[0]
            // borderColor: borderColorArr
          }];
        } else {
          return [{
            data: data,
            backgroundColor: chartColors
            // borderColor: borderColorArr
          }];
        }
      }
    }
};
