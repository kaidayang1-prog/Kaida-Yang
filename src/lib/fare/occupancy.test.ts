import { describe, expect, it } from "vitest";
import { buildFareLegs, RouteMismatchError, type RouteStopInput } from "./occupancy";
import { splitFare } from "./splitFare";

// 集合点模式：1 号点（地铁站）→ 2 号点（小区大门）→ Costco → 2 号点 → 1 号点
const STOPS: RouteStopInput[] = [
  { kind: "pickup", meetingPointId: "mp1" },
  { kind: "pickup", meetingPointId: "mp2" },
  { kind: "destination" },
  { kind: "dropoff", meetingPointId: "mp2" },
  { kind: "dropoff", meetingPointId: "mp1" },
];
const KMS = [2.4, 8.5, 8.8, 2.9];

describe("buildFareLegs", () => {
  it("乘客从自己的上车点到回程下车点一直在车上，车主每段都在", () => {
    const { legs, weights } = buildFareLegs(
      STOPS,
      KMS,
      [
        { payerId: "amy", pickupMeetingPointId: "mp1", dropoffMeetingPointId: "mp1", partySize: 1 },
        { payerId: "ben", pickupMeetingPointId: "mp2", dropoffMeetingPointId: "mp2", partySize: 1 },
      ],
      "lily",
    );
    expect(legs.map((leg) => leg.riders)).toEqual([
      ["lily", "amy"],
      ["lily", "amy", "ben"],
      ["lily", "amy", "ben"],
      ["lily", "amy"],
    ]);
    expect(weights).toEqual({ lily: 1, amy: 1, ben: 1 });
  });

  it("和 splitFare 一起用：Lily 和 Amy 坐的段一样，付的一样多", () => {
    const { legs, weights } = buildFareLegs(
      STOPS,
      KMS,
      [
        { payerId: "amy", pickupMeetingPointId: "mp1", dropoffMeetingPointId: "mp1", partySize: 1 },
        { payerId: "ben", pickupMeetingPointId: "mp2", dropoffMeetingPointId: "mp2", partySize: 1 },
      ],
      "lily",
    );
    const result = splitFare({ fuelLPer100km: 8.5, gasCentsPerLitre: 169, legs, weights });
    expect(result.totalCents).toBe(325);
    expect(result.shares).toEqual({ lily: 121, amy: 121, ben: 83 });
  });

  it("回程可以选另一个集合点下车", () => {
    const { legs } = buildFareLegs(
      STOPS,
      KMS,
      [{ payerId: "amy", pickupMeetingPointId: "mp1", dropoffMeetingPointId: "mp2", partySize: 1 }],
      "lily",
    );
    expect(legs.map((leg) => leg.riders.includes("amy"))).toEqual([true, true, true, false]);
  });

  it("同行家人记在权重里", () => {
    const { weights } = buildFareLegs(
      STOPS,
      KMS,
      [{ payerId: "amy", pickupMeetingPointId: "mp1", dropoffMeetingPointId: "mp1", partySize: 3 }],
      "lily",
    );
    expect(weights.amy).toBe(3);
  });

  it("集合点还没算进路线时报错（等路线重新计算）", () => {
    expect(() =>
      buildFareLegs(
        STOPS,
        KMS,
        [{ payerId: "amy", pickupMeetingPointId: "mp9", dropoffMeetingPointId: "mp1", partySize: 1 }],
        "lily",
      ),
    ).toThrow(RouteMismatchError);
  });

  it("段数必须等于站数减一，路线只能有一个超市", () => {
    expect(() => buildFareLegs(STOPS, [1, 2], [], "lily")).toThrow(RouteMismatchError);
    expect(() =>
      buildFareLegs([{ kind: "pickup", meetingPointId: "mp1" }, { kind: "dropoff", meetingPointId: "mp1" }], [1], [], "lily"),
    ).toThrow(RouteMismatchError);
  });
});
