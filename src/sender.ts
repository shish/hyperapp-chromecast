/*eslint no-unused-vars: "warn"*/

import type {
  Dispatch,
  Dispatchable,
  Effect,
  Subscription,
  Unsubscribe,
} from "hyperapp";
declare var chrome: any;
declare var cast: any;

type SenderSubProps<S> = {
  receiverApplicationId: string;
  onCastStateChanged?: Dispatchable<S>;
  onSessionStateChanged?: Dispatchable<S>;
  onRemotePlayerEvent?: Dispatchable<S>;
};

function _senderSub<S>(
  dispatch: Dispatch<S>,
  props: SenderSubProps<S>
): Unsubscribe {
  function onCastStateChanged(event) {
    if (props.onCastStateChanged) dispatch(props.onCastStateChanged, event);
  }
  function onSessionStateChanged(event) {
    if (props.onSessionStateChanged)
      dispatch(props.onSessionStateChanged, event);
  }
  function onRemotePlayerEvent(event) {
    if (props.onRemotePlayerEvent) dispatch(props.onRemotePlayerEvent, event);
  }

  window["__onGCastApiAvailable"] = function (isAvailable) {
    console.log("Casting available?", isAvailable);
    if (isAvailable) {
      console.log("Setting up cast context");
      // "on API available" is called before the API is actually
      // available???
      setTimeout(function () {
        let context = cast.framework.CastContext.getInstance();
        context.setOptions({
          receiverApplicationId: props.receiverApplicationId,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        if (props.onCastStateChanged) {
          context.addEventListener(
            cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            onCastStateChanged
          );
        }

        if (props.onSessionStateChanged) {
          context.addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            onSessionStateChanged
          );
        }

        if (props.onRemotePlayerEvent) {
          var player = new cast.framework.RemotePlayer();
          var controller = new cast.framework.RemotePlayerController(player);
          controller.addEventListener(
            cast.framework.RemotePlayerEventType.ANY_CHANGE,
            onRemotePlayerEvent
          );
        }
      }, 10);
    }
  };

  return function () {
    window["__onGCastApiAvailable"] = undefined;
    let context = cast.framework.CastContext.getInstance();
    if (props.onCastStateChanged) {
      context.removeEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        onCastStateChanged
      );
    }
    if (props.onSessionStateChanged) {
      context.removeEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        onSessionStateChanged
      );
    }
    if (props.onRemotePlayerEvent) {
      var player = new cast.framework.RemotePlayer();
      var controller = new cast.framework.RemotePlayerController(player);
      controller.removeEventListener(
        cast.framework.RemotePlayerEventType.ANY_CHANGE,
        onRemotePlayerEvent
      );
    }
    context.endCurrentSession(true); // stop casting
  };
}

export function SenderSub<S>(props): Subscription<S, SenderSubProps<S>> {
  return [_senderSub, props];
}

type LoadMediaProps<S> = {
  contentId: string;
  contentType: string;
  credentials: string;
  onSuccess: Dispatchable<S>;
  onFailure: Dispatchable<S>;
};
export function LoadMedia<S>(props: LoadMediaProps<S>): Effect<S> {
  return [
    function (dispatch, props) {
      let context = cast.framework.CastContext.getInstance();
      let castSession = context.getCurrentSession();
      var request = new chrome.cast.media.LoadRequest(props.mediaInfo);
      console.log(context, castSession, request);
      request.credentials = props.credentials;
      if (!castSession) {
        console.log("Attempted to loadMedia() with no open session");
        return;
      }
      castSession.loadMedia(request).then(
        function () {
          if (props.onSuccess) dispatch(props.onSuccess);
        },
        function (errorCode) {
          if (props.onFailure) dispatch(props.onFailure, errorCode);
        }
      );
    },
    props,
  ];
}

export function Stop<S>(): Effect<S> {
  return [
    function (dispatch, props) {
      var player = new cast.framework.RemotePlayer();
      var controller = new cast.framework.RemotePlayerController(player);
      controller.stop();
    },
    {},
  ];
}
export function PlayOrPause<S>(): Effect<S> {
  return [
    function (dispatch, props) {
      var player = new cast.framework.RemotePlayer();
      var controller = new cast.framework.RemotePlayerController(player);
      controller.playOrPause();
    },
    {},
  ];
}
export function MuteOrUnmute<S>(): Effect<S> {
  return [
    function (dispatch, props) {
      var player = new cast.framework.RemotePlayer();
      var controller = new cast.framework.RemotePlayerController(player);
      controller.muteOrUnmute();
    },
    {},
  ];
}
export function SetVolumeLevel<S>(volume: number): Effect<S> {
  return [
    function (dispatch, props) {
      var player = new cast.framework.RemotePlayer();
      var controller = new cast.framework.RemotePlayerController(player);
      player.volumeLevel = props.volume;
      controller.setVolumeLevel();
    },
    { volume },
  ];
}
export function Seek<S>(time: number): Effect<S> {
  return [
    function (dispatch, props) {
      var player = new cast.framework.RemotePlayer();
      var controller = new cast.framework.RemotePlayerController(player);
      player.currentTime = props.time;
      controller.seek();
    },
    { time },
  ];
}
