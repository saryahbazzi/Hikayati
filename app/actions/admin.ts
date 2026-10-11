"use server";

import { action } from "@/lib/server/action";
import {
  addDiscount, addStaff, adminAddPrice, adminDeletePrice, adminRegisterTemplate, adminSetPriceActive, adminSetTax, adminSetTemplateStatus, adminUpdateOverlay,
  adminUpdatePackage, adminUpdateTemplate, adminUpsertAddon, assignStaff, changeStaffRole, getCheckinPanel, markContactHandled, setAccountDisabled, setDiscountActive, unassignStaff,
  type PackageForm, type RegisterTemplateInput,
} from "@/lib/server/admin";
import { checkInByToken } from "@/lib/server/checkin";
import { uuidLike } from "@/lib/server/db";
import { ValidationError } from "@/lib/server/permissions";
import type { PriceInput } from "@/lib/server/catalog";

/* Thin wrappers: the actor always comes from the session cookie; every service re-checks permissions. */

export async function assignStaffAction(eventId: string, userId: string) { return action(({ db, actor }) => assignStaff(db, actor, eventId, userId)); }
export async function unassignStaffAction(eventId: string, userId: string, role: "manager" | "check_in") { return action(({ db, actor }) => unassignStaff(db, actor, eventId, userId, role)); }

export async function setAccountDisabledAction(userId: string, disabled: boolean) { return action(({ db, actor }) => setAccountDisabled(db, actor, userId, disabled)); }
export async function addStaffAction(input: { phone: string; dial: string; role: string; fullName?: string }) { return action(({ db, actor }) => addStaff(db, actor, input)); }
export async function changeStaffRoleAction(userId: string, role: string) { return action(({ db, actor }) => changeStaffRole(db, actor, userId, role)); }

export async function setTemplateStatusAction(id: string, status: "published" | "coming_soon" | "draft") { return action(({ db, actor }) => adminSetTemplateStatus(db, actor, id, status)); }
export async function updateTemplateAction(id: string, u: { en: string; ar: string; descEn: string; descAr: string; sort: number }) { return action(({ db, actor }) => adminUpdateTemplate(db, actor, id, u)); }
export async function registerTemplateAction(input: RegisterTemplateInput) { return action(({ db, actor }) => adminRegisterTemplate(db, actor, input)); }
export async function updateOverlayAction(templateId: string, overlayJson: string) { return action(({ db, actor }) => adminUpdateOverlay(db, actor, templateId, overlayJson)); }

export async function updatePackageAction(id: string, f: PackageForm) { return action(({ db, actor }) => adminUpdatePackage(db, actor, id, f)); }
export async function addPriceAction(packageId: string, p: PriceInput) { return action(({ db, actor }) => adminAddPrice(db, actor, packageId, p)); }
export async function setPriceActiveAction(priceId: string, active: boolean) { return action(({ db, actor }) => adminSetPriceActive(db, actor, priceId, active)); }
export async function deletePriceAction(priceId: string) { return action(({ db, actor }) => adminDeletePrice(db, actor, priceId)); }
export async function upsertAddonAction(a: { slug: string; en: string; ar: string; pricing: "flat" | "per_guest"; priceSar: number; active: boolean }) { return action(({ db, actor }) => adminUpsertAddon(db, actor, a)); }
export async function setTaxAction(percent: number) { return action(({ db, actor }) => adminSetTax(db, actor, percent)); }
export async function addDiscountAction(d: { code: string; percent: number; expiresAt?: string }) { return action(({ db, actor }) => addDiscount(db, actor, d)); }
export async function setDiscountActiveAction(id: string, active: boolean) { return action(({ db, actor }) => setDiscountActive(db, actor, id, active)); }

export async function markContactHandledAction(id: string) { return action(({ db, actor }) => markContactHandled(db, actor, id)); }

/** Live panel for the scanner page: counters + recent attempts. Requires check-in access to the event. */
export async function checkinPanelAction(eventId: string) { return action(({ db, actor }) => getCheckinPanel(db, actor, eventId)); }

/** Camera scan / manual code entry: identical server-side verification (token signature, event access, single use). */
export async function checkInManualAction(token: string, eventId: string, method: "scanner" | "manual" = "manual") {
  return action(({ db, actor }) => {
    if (!uuidLike.test(eventId)) throw new ValidationError({ event: "invalid" });
    return checkInByToken(db, actor, String(token).slice(0, 300), { expectedEventId: eventId, method: method === "scanner" ? "scanner" : "manual" });
  });
}
