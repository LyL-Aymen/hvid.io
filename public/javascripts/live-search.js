// Generated by CoffeeScript 1.4.0
(function() {
  var Search;

  window.Search = Search = (function() {
    var instances;

    instances = {};

    function Search(search_term, opts) {
      var my_timer, search_me,
        _this = this;
      if (this.constructor.name === "Search") {
        this.search_term = search_term;
        this.videos = {};
        this.events || (this.events = []);
        my_timer = null;
        search_me = function() {
          var finished, _ref;
          if (((_ref = Search.socket) != null ? _ref.emit : void 0) == null) {
            if (!my_timer) {
              return my_timer = setInterval(search_me, 100);
            }
          } else {
            if (my_timer) {
              clearInterval(my_timer);
            }
            finished = _(_this.events).filter(function(e) {
              return e.finished != null;
            }).pop().finished;
            return Search.socket.emit("search", _this.search_term, finished);
          }
        };
        _.defer(search_me);
      } else {
        return instances[search_term] || (instances[search_term] = new Search(search_term, opts));
      }
    }

    Search.prototype.video_reduce = function(video) {
      var msg, _base, _base1, _name, _name1;
      msg = video.msg;
      delete video.msg;
      video.dom_id = video.id.replace("/", "-");
      video.msgs = [];
      ((_base = this.videos)[_name = video.id] || (_base[_name] = video)).msgs.push(msg);
      this.videos[video.id] = ((_base1 = this.videos)[_name1 = video.id] || (_base1[_name1] = video));
      this.videos[video.id].date = msg.post_date;
      this.videos[video.id].score = (this.videos[video.id].score || 1) + msg.score;
      console.log("videos ", Object.keys(this.videos).length);
      return this.when(_(this.videos).keys().length, video.id);
    };

    Search.prototype.videos_by_posts = function() {
      return _(this.videos).sortBy(function(v) {
        return -v.msgs.length;
      });
    };

    Search.prototype.videos_by_date = function() {
      return _(this.videos).sortBy(function(v) {
        return -(new Date(v.date)).valueOf();
      });
    };

    Search.prototype.videos_ids = function() {
      return _(this.videos).keys();
    };

    Search.prototype.when = function(num, cb) {
      var i, _i, _ref, _ref1, _ref2, _ref3;
      if (_.isFunction(cb)) {
        this.events.push({
          num: num,
          callback: cb
        });
      } else if (this.events.length > 0) {
        for (i = _i = 0, _ref = this.events.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          if ((((_ref1 = this.events[i]) != null ? _ref1.num : void 0) != null) && this.events[i].num === num) {
            cb = this.events[i].callback;
            this.events.splice(i, 1);
            this.when_done = true;
            cb.call(this);
          } else if (this.when_done && (((_ref2 = this.events[i]) != null ? _ref2["video.new"] : void 0) != null)) {
            if ((!this.last_videos_length) || (this.last_videos_length < num)) {
              this.events[i]["video.new"].call(this.videos[cb]);
            }
          } else if (this.when_done && (((_ref3 = this.events[i]) != null ? _ref3["video.update"] : void 0) != null)) {
            if ((!this.last_videos_length) || (this.last_videos_length === num)) {
              this.events[i]["video.update"].call(this.videos[cb]);
            }
          }
        }
      }
      this.last_videos_length = num;
      return this;
    };

    Search.prototype.on = function(msg, cb) {
      var event;
      if (_.isFunction(cb)) {
        event = {};
        event[msg] = cb;
        if (!this.events.length) {
          this.when_done = true;
        }
        this.events.push(event);
      }
      return this;
    };

    Search.com_init = function(socket) {
      var _this = this;
      console.log("handling init");
      socket.on("search_result", function(res) {
        var video, _i, _len, _ref, _ref1, _results;
        _ref = res.videos;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          video = _ref[_i];
          _results.push((_ref1 = _this.get(res.search_term)) != null ? _ref1.video_reduce(video) : void 0);
        }
        return _results;
      });
      return Search.socket = socket;
    };

    Search.get = function(search_term) {
      return instances[search_term];
    };

    return Search;

  })();

}).call(this);
