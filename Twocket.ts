import fetch from 'node-fetch';
import { RawData, WebSocket } from 'ws';
import { CheerPayloadEvent, FollowPayloadEvent, RaidPayloadEvent, RewardRedemptionPayloadEvent, RewardRedemptionPayloadReward, SubscriptionGiftPayloadEvent, SubscriptionPayloadEvent } from './WebSocketPayloadEvent';

class Twocket {
    private TWITCH_USER_ID: string;
    private TWITCH_CLIENT_ID: string;
    private TWITCH_ACCESS_TOKEN: string;
    private ws: WebSocket | undefined;
    private TWITCH_SOCKET_ID: string | undefined;
    private scopes: string[] | [];

    private activeListeners: {[key: string]: (eventData: any) => void};

    constructor(twitchUserId: string, twitchClientId: string, twitchAccessToken: string, scopesToRegister: string[]) {
        this.TWITCH_USER_ID = twitchUserId;
        this.TWITCH_CLIENT_ID = twitchClientId;
        this.TWITCH_ACCESS_TOKEN = twitchAccessToken;
        this.scopes = scopesToRegister;
        this.activeListeners = {};
    }

    protected setTwitchSocketId(socketId: string) {
        this.TWITCH_SOCKET_ID = socketId;
    }

    private registerScopes() {
        //Register Events for given scopes
        if (this.scopes.length < 1) {
            this.ws?.close();
            throw new Error('Scopes cannot be 0, ensure you are adding this to the constructor!');
        } else {
            this.scopes.forEach(scope => {
                //register
                this.sendSubscriptionRequestToTwitch(scope);
            });
        }
    }

    start() {
        //Do websocket things
        this.ws = new WebSocket("wss://eventsub-beta.wss.twitch.tv/ws");

        this.ws.on('message', (data: RawData) => {
            let parsedData = JSON.parse(data.toString());

            switch (parsedData.metadata["message_type"]) {
                case "session_welcome":
                    this.setTwitchSocketId(parsedData.payload.session.id);

                    this.registerScopes();
                    break;

                case "session_reconnect":
                    //Do reconnect things
                    console.log("Reconnecting");

                    this.registerScopes();
                    break;

                case "notification":
                    //This needs to be more generic to allow for other event types not specified
                    let subType = parsedData.metadata["subscription_type"];

                    if(subType in this.activeListeners) {
                        console.log("found " + subType);
                    } else {
                        console.log("not found " + subType);
                    }

                    break;

                case "revocation":
                    let revokedSubscription = parsedData.payload.subscription;
                    //TODO Optional Logging here
                    console.log(revokedSubscription.type + " subscription revoked. Reason - " + revokedSubscription.status);
                    break;
            }
        });
    }

    stop() {
        this.ws?.close();
    }

    //TODO Work out why this isnt doing anything
    getCurrentSubscriptions() {
        const options = {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${this.TWITCH_ACCESS_TOKEN}`,
                'Client-Id': this.TWITCH_CLIENT_ID
            }
        };

        fetch('https://api.twitch.tv/helix/eventsub/subscriptions', options).then(response => {
            if (!response.ok) {
                throw new Error("Error retrieving subscriptions - " + response.status);
            } else {
                console.log("Got subs");
                response.json().then(response => {
                    console.log(response);
                });
            }
        });
    }

    /**
     * 
     * @param subscriptionType - the type of event you want to subscribe to listen for e.g. "channel.follow"
     * More info found at - https://dev.twitch.tv/docs/api/reference#create-eventsub-subscription
     */
    private async sendSubscriptionRequestToTwitch(subscriptionType: String) {
        //TODO Potential validation on the subscrtiptionType to ensure the user is requesting a 
        //valid (or already requested sub type).

        const options = {
            method: 'POST',
            body: `{"type":"${subscriptionType}","version":"1","condition":{"broadcaster_user_id":"${this.TWITCH_USER_ID}"},"transport":{"method":"websocket","session_id":"${this.TWITCH_SOCKET_ID}"}}`,
            headers: {
                Authorization: `Bearer ${this.TWITCH_ACCESS_TOKEN}`,
                'Client-Id': this.TWITCH_CLIENT_ID,
                'Content-Type': 'application/json'
            }
        };

        let response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', options);

        if (!response.ok) {
            throw new Error("Error creating subscription - " + response.status);
        } else {
            //TODO Maybe do verbose logging of creating connections?
            console.log(subscriptionType + " subscription created");
        }
    }

    /** Handler handlers.
    * 
    *   A suite of handlers for dealing with the various subscription types. 
    *   They are simple setters but each of them have their own related parameters 
    *   e.g. RewardRedemptionPayloadEvent
    * 
    *   These are convenience methods, for the most common use cases, if you require other eventsub events,
    *   check out the generic setEventSubHandler().
    */
    setOnChannelPointRewardRedeem(newHandler: (eventData: RewardRedemptionPayloadEvent) => void) {
        this.setEventSubHandler("channel.channel_points_custom_reward_redemption.add", newHandler);
    }

    setOnFollowEvent(newHandler: (eventData: FollowPayloadEvent) => void) {
        this.setEventSubHandler("channel.follow", newHandler);
    }

    setOnSubscribeEvent(newHandler: (eventData: SubscriptionPayloadEvent) => void) {
        this.setEventSubHandler("channel.subscribe", newHandler);
    }

    setOnRaidEvent(newHandler: (eventData: RaidPayloadEvent) => void) {
        this.setEventSubHandler("channel.raid", newHandler);
    }

    setOnCheerEvent(newHandler: (eventData: CheerPayloadEvent) => void) {
        this.setEventSubHandler("channel.cheer", newHandler);
    }

    setOnGiftSubscribeEvent(newHandler: (eventData: SubscriptionGiftPayloadEvent) => void) {
        this.setEventSubHandler("channel.subscription.gift", newHandler);
    }

    /**
     * A generic method of supplying an event handler to a given subscription type event
     * 
     * @param eventType - EventSub Subscription type
     * @param newHandler - event handler to trigger when given event is received on the socket.
     */
    setEventSubHandler(eventType: string, newHandler: (eventData: any) => void) {
        this.activeListeners[eventType] = newHandler;
    }
}

export {
    SubscriptionGiftPayloadEvent,
    CheerPayloadEvent,
    RaidPayloadEvent,
    SubscriptionPayloadEvent,
    RewardRedemptionPayloadReward,
    RewardRedemptionPayloadEvent,
    FollowPayloadEvent,
    Twocket
}
