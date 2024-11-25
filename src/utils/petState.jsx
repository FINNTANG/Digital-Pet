const PET_STATES = {
  HAPPY: 'happy',
  NORMAL: 'normal',
  SAD: 'sad',
  SICK: 'sick',
  DEAD: 'dead'
};

const HEALTH_THRESHOLD = {
  CRITICAL: 20,
  LOW: 40,
  MEDIUM: 60,
  HIGH: 80
};

class PetState {
  constructor() {
    this.health = 100;
    this.happiness = 100;
    this.lastFed = Date.now();
    this.lastInteraction = Date.now();
    this.state = PET_STATES.HAPPY;
    this.silentResponses = 0;
  }

  updateState() {
    const timeSinceLastFed = (Date.now() - this.lastFed) / (1000 * 60);
    const timeSinceLastInteraction = (Date.now() - this.lastInteraction) / (1000 * 60);

    if (timeSinceLastFed > 30) {
      this.health -= 5;
    }
    if (timeSinceLastInteraction > 60) {
      this.happiness -= 10;
    }

    this.updatePetState();
  }

  updatePetState() {
    if (this.health <= 0 || this.happiness <= 0) {
      this.state = PET_STATES.DEAD;
    } else if (this.health < HEALTH_THRESHOLD.CRITICAL || this.happiness < HEALTH_THRESHOLD.CRITICAL) {
      this.state = PET_STATES.SICK;
    } else if (this.silentResponses > 5) {
      this.state = PET_STATES.SAD;
    } else if (this.health > HEALTH_THRESHOLD.HIGH && this.happiness > HEALTH_THRESHOLD.HIGH) {
      this.state = PET_STATES.HAPPY;
    } else {
      this.state = PET_STATES.NORMAL;
    }
  }

  feed(isFood) {
    if (this.state === PET_STATES.DEAD) return;

    this.lastFed = Date.now();
    if (isFood) {
      this.health = Math.min(100, this.health + 20);
      this.happiness = Math.min(100, this.happiness + 10);
    } else {
      this.health = Math.max(0, this.health - 30);
      this.happiness = Math.max(0, this.happiness - 20);
    }
    this.updatePetState();
  }

  interact(isSilent) {
    if (this.state === PET_STATES.DEAD) return;

    this.lastInteraction = Date.now();
    if (isSilent) {
      this.silentResponses++;
      this.happiness = Math.max(0, this.happiness - 15);
    } else {
      this.silentResponses = 0;
      this.happiness = Math.min(100, this.happiness + 10);
    }
    this.updatePetState();
  }
}

const petState = new PetState();
export default petState; 