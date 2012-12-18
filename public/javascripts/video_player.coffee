class IFramePlayer 
  constructor: (@opts = {}) ->

    @iframe = document.createElement "iframe"
    @opts = video_id: video_id if typeof( @opts ) is "string"
    
    for k, v of @opts.iframe_params
      if @iframe[k]?
        @iframe[k] = v

    switch typeof @opts.src_params 
      when "object"
        for k, v of @opts.src_params
          if v is true then v = 1
          @iframe.src += "&#{k}=#{v}"
      when "string"
        @iframe.src += "&#{@opts.src_params}"
    

    ###
    if @opts.timeline
      @timeline = @opts.timeline
      console.log "Timeline", @timeline
    ###

    @opts.sec_uri or= "*"

    @ee = new EventEmitter2()


  appendTo: (@container) ->
    @container.appendChild @iframe
    @init()

  post: (msg) ->
     @iframe.contentWindow.postMessage JSON.stringify(msg), @opts.sec_uri

  init: ->
    check = 
      DocRdy: null
      PlayerRdy: null

    onMessageReceived = (e) => 
      clearInterval check.PlayerRdy
      data = JSON.parse(e.data)
      console.log data
      @ee.emit data.event, data
      ###
      switch data.event
        when "infoDelivery"
          data.info.currentTime
          @timeline.forEach (entry) ->
            if not entry.done and ((data.info.currentTime * 1.second) > entry.at)
              entry.do()
              entry.done = true
      ###

    check.DocRdy = setInterval =>
        if document.readyState == "complete"
          clearInterval check.DocRdy
          if window.addEventListener
            window.addEventListener 'message', onMessageReceived, false
          else
            window.attachEvent 'onmessage', onMessageReceived, false

          if @opts.check_ready
            check.PlayerRdy = setInterval =>
              console.log @opts.check_ready
              @opts.check_ready()
            , 100
      , 100

  on: (event, cb) -> @ee.on event, (data...) =>
    cb.apply @, data

  emit: (event, data) -> @ee.emit event, data

class YoutubePlayer extends IFramePlayer
  constructor: (opts = {}) ->
    opts.iframe_params or= {}
    opts.iframe_params.src = "http://www.youtube.com/embed/#{opts.video_id}?enablejsapi=1"
    opts.events_handler = 
      onReady: ->
      onStateChange: ->

    opts.check_ready = =>
      @post
        event: "listening"
        id: "player"

    super opts

    @on "onReady", =>
      @emit "ready"
    @on "onStateChange", (data) =>
      console.log "onStateChange"
      if data.info.playerState == 0
        @emit "finish"

  play: ->
    @post 
      event: "command"
      func: "playVideo"
      id: "player"


class VimeoPlayer extends IFramePlayer
  constructor: (opts = {}) ->
    opts.iframe_params or= {}
    opts.iframe_params.src = "http://player.vimeo.com/video/#{opts.video_id}?api=1"

    opts.events_handler = 
      ready: ->
      finish: ->

    opts.sec_uri = opts.iframe_params.src.split("?")[0]

    super opts

    @on "ready", =>
      @post 
        method: "addEventListener"
        value: "playProgress"
      @post 
        method: "addEventListener"
        value: "finish"
  
  play: ->
    @post method: "play"


class VideoPlayer

  constructor: (@container) ->

  load: (video_obj) ->
    $("iframe", @container).remove()
    player_opts = 

    @player = switch video_obj.provider
      when "youtube"
        new YoutubePlayer(video_obj)
      when "vimeo"
        new VimeoPlayer(video_obj)

    console.log @player, @container
    @player.appendTo @container
    
    @

  play: ->
    @player.play()

  on: (args...) ->
    @player.on args...

window.VideoPlayer = VideoPlayer
