/**
 * Physical ALTANA office locations.
 * Independent from Property and Project.
 */

export interface OfficeLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
}
