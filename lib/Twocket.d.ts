import { CheerPayloadEvent, FollowPayloadEvent, RaidPayloadEvent, RewardRedemptionPayloadEvent, RewardRedemptionPayloadReward, SubscriptionGiftPayloadEvent, SubscriptionPayloadEvent } from './WebSocketPayloadEvent';
declare class Twocket {
    private TWITCH_USER_ID;
    private TWITCH_CLIENT_ID;
    private TWITCH_ACCESS_TOKEN;
    private ws;
    private TWITCH_SOCKET_ID;
    private scopes;
    private activeListeners;
    constructor(twitchUserId: string, twitchClientId: string, twitchAccessToken: string, scopesToRegister: string[]);
    protected setTwitchSocketId(socketId: string): void;
    private registerScopes;
    start(): void;
    stop(): void;
    getCurrentSubscriptions(): void;
    /**
     *
     * @param subscriptionType - the type of event you want to subscribe to listen for e.g. "channel.follow"
     * More info found at - https://dev.twitch.tv/docs/api/reference#create-eventsub-subscription
     */
    private sendSubscriptionRequestToTwitch;
    /** Handler handlers.
    *
    *   A suite of handlers for dealing with the various subscription types.
    *   They are simple setters but each of them have their own related parameters
    *   e.g. RewardRedemptionPayloadEvent
    *
    *   These are convenience methods, for the most common use cases, if you require other eventsub events,
    *   check out the generic setEventSubHandler().
    */
    setOnChannelPointRewardRedeem(newHandler: (eventData: RewardRedemptionPayloadEvent) => void): void;
    setOnFollowEvent(newHandler: (eventData: FollowPayloadEvent) => void): void;
    setOnSubscribeEvent(newHandler: (eventData: SubscriptionPayloadEvent) => void): void;
    setOnRaidEvent(newHandler: (eventData: RaidPayloadEvent) => void): void;
    setOnCheerEvent(newHandler: (eventData: CheerPayloadEvent) => void): void;
    setOnGiftSubscribeEvent(newHandler: (eventData: SubscriptionGiftPayloadEvent) => void): void;
    /**
     * A generic method of supplying an event handler to a given subscription type event
     *
     * @param eventType - EventSub Subscription type
     * @param newHandler - event handler to trigger when given event is received on the socket.
     */
    setEventSubHandler(eventType: string, newHandler: (eventData: any) => void): void;
}
export { SubscriptionGiftPayloadEvent, CheerPayloadEvent, RaidPayloadEvent, SubscriptionPayloadEvent, RewardRedemptionPayloadReward, RewardRedemptionPayloadEvent, FollowPayloadEvent, Twocket };