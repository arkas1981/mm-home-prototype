import {
  createServerFn,
} from "@tanstack/react-start";

import type {
  RateType,
} from "./booking";

type CheckoutInput = {
  checkIn: string;
  checkOut: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  rate: RateType;
  adult: boolean;
  terms: boolean;
  nonrefAck: boolean;
  expectedTotal: number;
};

export const createBookingCheckout =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (
        d: CheckoutInput
      ) => d
    )
    .handler(
      async ({ data }) => {
        const {
          startCheckout,
        } = await import(
          "./booking-payment.server"
        );

        return startCheckout(
          data
        );
      }
    );

export const confirmBookingCheckout =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (d: {
        sessionId: string;
      }) => d
    )
    .handler(
      async ({ data }) => {
        const {
          confirmCheckout,
        } = await import(
          "./booking-payment.server"
        );

        return confirmCheckout(
          data.sessionId
        );
      }
    );
