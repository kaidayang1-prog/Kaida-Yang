import type { FareLegInput } from "./splitFare";

/**
 * 从路线和报名推出“每段车上有谁”，交给 splitFare 计算。
 *
 * 公开路线只包括集合点和超市：
 *   去程各集合点（pickup）→ 超市（destination）→ 回程各集合点（dropoff，默认倒序）
 * 乘客从他选的上车集合点开始在车上，直到回程他选的下车集合点（默认同一点）。
 * 车主每一段都在车上。车主家到集合点那两段只有车主，不在公开路线里，也不分摊。
 */

export type StopKind = "pickup" | "destination" | "dropoff";

export interface RouteStopInput {
  kind: StopKind;
  /** 集合点（trip_meeting_points.id）；超市这一站为空 */
  meetingPointId?: string;
}

export interface BookingInput {
  /** 付款人 id（乘客的用户 id） */
  payerId: string;
  pickupMeetingPointId: string;
  dropoffMeetingPointId: string;
  /** 含本人的同行人数，1–4 */
  partySize: number;
}

export class RouteMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouteMismatchError";
  }
}

export function buildFareLegs(
  stops: readonly RouteStopInput[],
  legKms: readonly number[],
  bookings: readonly BookingInput[],
  driverId: string,
): { legs: FareLegInput[]; weights: Record<string, number> } {
  if (legKms.length !== stops.length - 1) {
    throw new RouteMismatchError("there must be exactly one leg between each pair of stops");
  }
  const destinationIndex = stops.findIndex((stop) => stop.kind === "destination");
  if (destinationIndex < 0 || stops.findIndex((s, i) => s.kind === "destination" && i !== destinationIndex) >= 0) {
    throw new RouteMismatchError("the route must have exactly one destination");
  }

  const weights: Record<string, number> = { [driverId]: 1 };
  const onBoard: { payerId: string; from: number; to: number }[] = [];

  for (const booking of bookings) {
    if (booking.payerId === driverId) throw new RouteMismatchError("the driver cannot book their own trip");
    if (weights[booking.payerId] !== undefined) throw new RouteMismatchError("one booking per rider");
    const from = stops.findIndex(
      (stop, i) => i < destinationIndex && stop.kind === "pickup" && stop.meetingPointId === booking.pickupMeetingPointId,
    );
    const to = stops.findIndex(
      (stop, i) => i > destinationIndex && stop.kind === "dropoff" && stop.meetingPointId === booking.dropoffMeetingPointId,
    );
    if (from < 0 || to < 0) {
      throw new RouteMismatchError("a booking's meeting point is not on the route yet");
    }
    weights[booking.payerId] = booking.partySize;
    onBoard.push({ payerId: booking.payerId, from, to });
  }

  const legs = legKms.map((km, legIndex) => ({
    km,
    riders: [
      driverId,
      ...onBoard.filter((rider) => rider.from <= legIndex && legIndex < rider.to).map((rider) => rider.payerId),
    ],
  }));

  return { legs, weights };
}
