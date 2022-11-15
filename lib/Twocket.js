"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Twocket = void 0;
var node_fetch_1 = require("node-fetch");
var ws_1 = require("ws");
var Twocket = /** @class */ (function () {
    function Twocket(twitchUserId, twitchClientId, twitchAccessToken, scopesToRegister) {
        this.TWITCH_USER_ID = twitchUserId;
        this.TWITCH_CLIENT_ID = twitchClientId;
        this.TWITCH_ACCESS_TOKEN = twitchAccessToken;
        this.scopes = scopesToRegister;
        this.activeListeners = {};
    }
    Twocket.prototype.setTwitchSocketId = function (socketId) {
        this.TWITCH_SOCKET_ID = socketId;
    };
    Twocket.prototype.registerScopes = function () {
        var _this = this;
        var _a;
        //Register Events for given scopes
        if (this.scopes.length < 1) {
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
            throw new Error('Scopes cannot be 0, ensure you are adding this to the constructor!');
        }
        else {
            this.scopes.forEach(function (scope) {
                //register
                _this.sendSubscriptionRequestToTwitch(scope);
            });
        }
    };
    Twocket.prototype.start = function () {
        var _this = this;
        //Do websocket things
        this.ws = new ws_1.WebSocket("wss://eventsub-beta.wss.twitch.tv/ws");
        this.ws.on('message', function (data) {
            var parsedData = JSON.parse(data.toString());
            switch (parsedData.metadata["message_type"]) {
                case "session_welcome":
                    _this.setTwitchSocketId(parsedData.payload.session.id);
                    _this.registerScopes();
                    break;
                case "session_reconnect":
                    //Do reconnect things
                    console.log("Reconnecting");
                    _this.registerScopes();
                    break;
                case "notification":
                    //This needs to be more generic to allow for other event types not specified
                    var subType = parsedData.metadata["subscription_type"];
                    if (subType in _this.activeListeners) {
                        console.log("found " + subType);
                    }
                    else {
                        console.log("not found " + subType);
                    }
                    break;
                case "revocation":
                    var revokedSubscription = parsedData.payload.subscription;
                    //TODO Optional Logging here
                    console.log(revokedSubscription.type + " subscription revoked. Reason - " + revokedSubscription.status);
                    break;
            }
        });
    };
    Twocket.prototype.stop = function () {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
    };
    //TODO Work out why this isnt doing anything
    Twocket.prototype.getCurrentSubscriptions = function () {
        var options = {
            method: 'GET',
            headers: {
                Authorization: "Bearer ".concat(this.TWITCH_ACCESS_TOKEN),
                'Client-Id': this.TWITCH_CLIENT_ID
            }
        };
        (0, node_fetch_1.default)('https://api.twitch.tv/helix/eventsub/subscriptions', options).then(function (response) {
            if (!response.ok) {
                throw new Error("Error retrieving subscriptions - " + response.status);
            }
            else {
                console.log("Got subs");
                response.json().then(function (response) {
                    console.log(response);
                });
            }
        });
    };
    /**
     *
     * @param subscriptionType - the type of event you want to subscribe to listen for e.g. "channel.follow"
     * More info found at - https://dev.twitch.tv/docs/api/reference#create-eventsub-subscription
     */
    Twocket.prototype.sendSubscriptionRequestToTwitch = function (subscriptionType) {
        return __awaiter(this, void 0, void 0, function () {
            var options, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = {
                            method: 'POST',
                            body: "{\"type\":\"".concat(subscriptionType, "\",\"version\":\"1\",\"condition\":{\"broadcaster_user_id\":\"").concat(this.TWITCH_USER_ID, "\"},\"transport\":{\"method\":\"websocket\",\"session_id\":\"").concat(this.TWITCH_SOCKET_ID, "\"}}"),
                            headers: {
                                Authorization: "Bearer ".concat(this.TWITCH_ACCESS_TOKEN),
                                'Client-Id': this.TWITCH_CLIENT_ID,
                                'Content-Type': 'application/json'
                            }
                        };
                        return [4 /*yield*/, (0, node_fetch_1.default)('https://api.twitch.tv/helix/eventsub/subscriptions', options)];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Error creating subscription - " + response.status);
                        }
                        else {
                            //TODO Maybe do verbose logging of creating connections?
                            console.log(subscriptionType + " subscription created");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Handler handlers.
    *
    *   A suite of handlers for dealing with the various subscription types.
    *   They are simple setters but each of them have their own related parameters
    *   e.g. RewardRedemptionPayloadEvent
    *
    *   These are convenience methods, for the most common use cases, if you require other eventsub events,
    *   check out the generic setEventSubHandler().
    */
    Twocket.prototype.setOnChannelPointRewardRedeem = function (newHandler) {
        this.setEventSubHandler("channel.channel_points_custom_reward_redemption.add", newHandler);
    };
    Twocket.prototype.setOnFollowEvent = function (newHandler) {
        this.setEventSubHandler("channel.follow", newHandler);
    };
    Twocket.prototype.setOnSubscribeEvent = function (newHandler) {
        this.setEventSubHandler("channel.subscribe", newHandler);
    };
    Twocket.prototype.setOnRaidEvent = function (newHandler) {
        this.setEventSubHandler("channel.raid", newHandler);
    };
    Twocket.prototype.setOnCheerEvent = function (newHandler) {
        this.setEventSubHandler("channel.cheer", newHandler);
    };
    Twocket.prototype.setOnGiftSubscribeEvent = function (newHandler) {
        this.setEventSubHandler("channel.subscription.gift", newHandler);
    };
    /**
     * A generic method of supplying an event handler to a given subscription type event
     *
     * @param eventType - EventSub Subscription type
     * @param newHandler - event handler to trigger when given event is received on the socket.
     */
    Twocket.prototype.setEventSubHandler = function (eventType, newHandler) {
        this.activeListeners[eventType] = newHandler;
    };
    return Twocket;
}());
exports.Twocket = Twocket;
