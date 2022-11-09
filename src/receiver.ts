import type {
  Dispatch,
  Dispatchable,
  Subscription,
  Unsubscribe,
} from "hyperapp";
declare var cast: any;

type ReceiverSubProps<S> = {
  onMessageLoad?: Dispatchable<S>;
  loadMessageInterceptor?: CallableFunction;
};
function _chromecastReceiverSub<S>(
  dispatch: Dispatch<S>,
  props: ReceiverSubProps<S>
): Unsubscribe {
  // Subscribe: set message interceptor callback and start
  const context = cast.framework.CastReceiverContext.getInstance();
  const playerManager = context.getPlayerManager();

  if (props.onMessageLoad || props.loadMessageInterceptor) {
    playerManager.setMessageInterceptor(
      cast.framework.messages.MessageType.LOAD,
      function (data) {
        if (props.onMessageLoad) dispatch(props.onMessageLoad, data);
        if (props.loadMessageInterceptor)
          return props.loadMessageInterceptor(data);
        else return null;
      }
    );
  }

  // TODO: options from props
  const options = new cast.framework.CastReceiverOptions();
  // this should default to false, but right now hypercast-receiver only
  // has one user, who needs it to be true
  options.disableIdleTimeout = true;

  context.start(options);

  // Unsubscribe: remove interceptor callback and stop
  return function () {
    if (props.onMessageLoad) {
      playerManager.setMessageInterceptor(
        cast.framework.messages.MessageType.LOAD,
        null
      );
    }
    context.stop();
  };
}

export function ReceiverSub<S>(
  props: ReceiverSubProps<S>
): Subscription<S, ReceiverSubProps<S>> {
  return [_chromecastReceiverSub, props];
}
