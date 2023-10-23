/* eslint-disable max-classes-per-file */

import { EventEmitter } from 'events';
import { wbcList } from '../data/slackUsers';

class RTMMock extends EventEmitter {
  // eslint-disable-next-line class-methods-use-this
  start() {
    return Promise.resolve(true);
  }

  // Function to test emits
  async publish(message: any) {
    this.emit('message', message);
  }
}

class WebMock {
  users = {
    list() {
      return Promise.resolve(wbcList);
    },
  };
}

export { RTMMock, WebMock };
