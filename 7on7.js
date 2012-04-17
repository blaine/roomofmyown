Collages = new Meteor.Collection("collages")
Objects = new Meteor.Collection("objects")
Users = new Meteor.Collection("users")
Crits = new Meteor.Collection("crits")

function currentUser () {
  return Users.findOne(Session.get('user'))
}

if (Meteor.is_client) {

  Meteor.subscribe("collages", function () {
/*    if (!Session.get('collage_id')) {
      var collage = Collages.findOne();
      if (collage) Router.setCollage(collage._id);
    }*/
  });

  Template.selector.collages = function () {
    return Collages.find() //{email: currentUser().email});
  }

  Template.collage_selector.events = {
    'click': function () {
      var nobjects = Objects.find({collage_id: this._id}).fetch().length
      console.log('number of objects in ', this._id, nobjects);

      if (nobjects >= 40) {
        $("#toofull").show();
      } else {
        Objects.insert({url: Session.get('post_url'), text: Session.get('post_text'), collage_id: this._id});
        $("#selector").hide();
        Router.setCollage(this._id)
      }
    }
  }

  Template.toofull.events = {
    'click button#noop': function () {
      $("#toofull").hide();
    },

    'click button#publish': function () {
    }
  }

  Meteor.autosubscribe(function () {
    var collage_id = Session.get('collage_id');
    if (collage_id) Meteor.subscribe('objects', collage_id);
  });

  Template.public_collages.collages = function () {
    return Collages.find({public: true});
  }

  Template.collages.collages = function () {
    if (!currentUser()) {
      return [];
    } else {
      return Collages.find()//{email: currentUser().email});
    }
  }

  Template.crits.events = {
    'click button#sharecrit': function (evt) {
      Crits.insert({collage_id: Session.get('collage_id'), text: $("#crittext").val()})
      $("#crittext").val('');
      $("#crits").hide();
      $("#objects").css('top', 0)
    },

    'click button#viewcrit': function (evt) {
      $("#crits").hide();
      $("#critlist").show();
    }
  }

  Template.crits.crits = function () {
    if (Session.get('collage_id')) {
    console.log(Session.get('collage_id'))
      return Crits.find({collage_id: Session.get('collage_id')})
    } else {
      return []
    }
  }

  Template.crits.klass = function () {
    collage = Collages.findOne(Session.get('collage_id'))

    if (!collage) {
      return "nothing"
    } else if (collage.public) {
      return "public"
    } else {
      return "privateish"
    }
   
  }

  Template.add_collage.events = {
    "click #addbtn": function (evt) {
      Collages.insert({name: $("#cname").val()})
      $("#cname").val('');
    }
  }
  
  Template.collage.events = {
    'mousedown': function (evt) {
      Router.setCollage(this._id);
    }
  }

  Template.collage.selected = function () {
    return Session.equals('collage_id', this._id) ? 'selected' : '';
  }

  Template.objects.objects = function () {
    var collage_id = Session.get('collage_id')
    if (!collage_id) return [];

    return Objects.find({collage_id: collage_id});
  }

  Template.objects.klass = function () {
  console.log(this)
    collage = Collages.findOne(Session.get('collage_id'))
    console.log(this.collage_id)

    if (!collage) {
      return "nothing"
    } else if (collage.public) {
      return "public"
    } else {
      return "privateish"
    }
  }

  Template.objects.events = {
    'click button': function (evt) {
      Objects.insert({url: $("#objurl").val(), text: $("#objtext").val(), collage_id: Session.get('collage_id')});
      $("#objtext").val('');
      $("#objurl").val('');
    }
  }

  Template.object.orientation = function () {
    var img = new Image();
    img.src = this.url;

    if (img.height > img.width) {
      return "portrait"
    } else {
      return "landscape"
    }
  }

  var whatType = function (obj) {
    var type;
    if (obj.text === undefined || obj.text == '') {
      if (obj.url.match(/\.mp4$/)) {
        type = 'video';
      } else {
        type = 'image';
      }
    } else {
      type = 'text';
    }

    return type
  }

  Template.object.type = function () {
    return whatType(this);
  }

  Template.object.isType = function (cmpType) {
    return whatType(this) == cmpType;
  }

  Template.object.video = function () {
    if (this.url.match(/mp4$/)) {
      return this.url
    } else {
      return false
    }
  }

  Template.object.events = {
    'dblclick': function (evt) {
      Objects.remove(this._id);
    }
  }

  var CollageRouter = Backbone.Router.extend({
    routes: {
      "p?*args": "newquote",
      ":collage_id": "main"
    },
  
    main: function (collage_id) {
      if (!collage_id) {
        collage = Collages.insert({});
        collage_id = collage.id
      }
      Session.set("collage_id", collage_id);
    },

    newquote: function () {
      var q = window.location.search.substring(1);
      var vars = q.split("&");
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=')
        if (pair[0] == 'url') {
          Session.set('post_url', unescape(pair[1]))
        } else if (pair[0] == 'text') {
          Session.set('post_text', unescape(pair[1]))
        }
      }
      $("#selector").show();
    },

    setCollage: function (collage_id) {
      this.navigate(collage_id, true);
    }
  });
  
  Router = new CollageRouter;
  
  Meteor.startup(function () {
    Backbone.history.start({pushState: true});

    if (document.cookie === undefined || document.cookie == '') {
      user = Users.insert({email: 'unset'})
      document.cookie = user
      Session.set('user', user);
    } else {
      Session.set('user', document.cookie);
    }

  });
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("collages", function () {
    return Collages.find();
  });

  Meteor.publish("objects", function (collage_id) {
    return Objects.find({collage_id: collage_id});
  });
}
