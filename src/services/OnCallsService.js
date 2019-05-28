// ------- Imports -------------------------------------------------------------

import logger from 'winston';

// ------- Internal imports ----------------------------------------------------

import { OnCall } from '../models/OnCall';
import { INCLUDE_USERS } from './PagerDutyClient';

// ------- OnCallsService ------------------------------------------------------

export class OnCallsService {
  constructor(pagerDutyClient) {
    this.client = pagerDutyClient;
    this.onCallRepo = new Map();
  }

  async load(schedulesService, incidentsService) {
    const schedules = schedulesService.schedulesRepo;
    const incidents = incidentsService.incidentsRepo;
    if (!schedules.size) {
      logger.verbose('Skipping on-calls load: Schedules not loaded yet');
      return false;
    }

    const missingSchedules = new Set();
    const includeFlags = new Set([INCLUDE_USERS]);

    for (const [scheduleId, schedule] of schedules.entries()) {
      if (!schedule || !schedule.id) {
        logger.verbose(
          `On-call for schedule ${scheduleId} skipped, schedule isn't loaded`,
        );
        this.onCallRepo.set(scheduleId, null);
        continue;
      }
      try {
        // Limit the number of requests by sending them in sync.
        // eslint-disable-next-line no-await-in-loop
        const record = await this.client.getOnCallForSchedule(
          schedule.id,
          includeFlags,
        );

        const onCall = OnCall.fromApiRecord(record, schedule);

        // eslint-disable-next-line no-await-in-loop
        onCall.contactMethods = await this.client.getContactMethods(onCall.userId);

        // Needed because of full override.
        if (incidents.has(schedule.id)) {
          onCall.setIncident(incidents.get(schedule.id));
        }

        logger.verbose(`On-call for schedule ${schedule.id} is loaded`);
        logger.silly(`On-call loaded ${onCall.toString()}`);

        this.onCallRepo.set(schedule.id, onCall);
      } catch (e) {
        logger.warn(`Error loading on-call for ${schedule.id}: ${e}`);
      }
    }

    if (missingSchedules.size) {
      logger.warn(
        `Missing oncall data for schedules: ${Array.from(missingSchedules).join()}`,
      );
    }
    return true;
  }

  serialize() {
    const result = [];
    for (const onCall of this.onCallRepo.values()) {
      if (!onCall) {
        continue;
      }
      result.push(onCall.serialize());
    }
    return result;
  }
  // ------- Class end  --------------------------------------------------------
}

// ------- End -----------------------------------------------------------------
