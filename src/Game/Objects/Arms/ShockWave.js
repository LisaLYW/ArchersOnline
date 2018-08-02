function ShockWave(
    posX, posY, vX, vY,
    aAllObjs, aObstacle, aDestroyable, aProps,
    master
) {
    Arrow.call(
        this,
        posX, posY, vX, vY, Arrow.eAssets.eShockWaveTexture,
        aAllObjs, aObstacle, aDestroyable, aProps,
        master
    );

    this.mEffectTimeLimit = 120;

    this.mGenerateParticles = 1;
    this.mParticles = new ParticleGameObjectSet();
}

gEngine.Core.inheritPrototype(ShockWave, Arrow);


ShockWave.prototype.update = function () {
    Arrow.prototype.update.call(this);

    if (this.mGenerateParticles === 1) {
        var p = this.createParticle(this.getXform().getXPos(), this.getXform().getYPos());
        this.mParticles.addToSet(p);
    }
    gEngine.ParticleSystem.update(this.mParticles);
};

ShockWave.prototype.draw = function (aCamera) {
    this.mParticles.draw(aCamera);
    Arrow.prototype.draw.call(this, aCamera);
};


ShockWave.prototype.createParticle = function (atX, atY) {
    var life = 30 + Math.random() * 200;
    var p = new ParticleGameObject(ParticleSystem.eAssets.eSnow, atX, atY, life);
    p.getRenderable().setColor([0.898, 0.898, 0.976, 1]);

    // size of the particle
    var r = 3.5 + Math.random() * 2.5;
    p.getXform().setSize(r, r);

    // final color
    var fr = 3.5 + Math.random();
    var fg = 0.4 + 0.1 * Math.random();
    var fb = 0.3 + 0.1 * Math.random();
    p.setFinalColor([fr, fg, fb, 0.6]);

    // velocity on the particle
    var fx = 10 * Math.random() - 20 * Math.random();
    var fy = 10 * Math.random();
    p.getParticle().setVelocity([fx, fy]);

    // size delta
    p.setSizeDelta(0.98);

    return p;
};

ShockWave.prototype.effectOnObstacle = function (obj) {
    this.mAllObjs.removeFromSet(this);

    this.shock();

    this.mGenerateParticles = 0;
    this.mCurrentState = Arrow.eArrowState.eHit;
};

ShockWave.prototype.effectOnArcher = function (obj) {
    this.mAllObjs.removeFromSet(this);
    obj.loseHp(2);

    this.shock();

    this.mGenerateParticles = 0;
    this.mCurrentState = Arrow.eArrowState.eHit;
};

ShockWave.prototype.effectOnDestroyable = function (obj) {
    this.mAllObjs.removeFromSet(this);

    this.shock();

    if (obj instanceof LifePotion) {
        this.mMaster.getArcher().addHp(obj.getRestore());
        this.mAllObjs.removeFromSet(obj);
        this.mDestroyable.removeFromSet(obj);
        this.mProps.removeFromSet(obj);
    }
    else if (obj instanceof Bow) {
        this.mMaster.getMoreArm(obj.getArmNum(), obj.getArmAmount());
        this.mAllObjs.removeFromSet(obj);
        this.mDestroyable.removeFromSet(obj);
        this.mProps.removeFromSet(obj);
    }
    else if (obj instanceof Mine) {
        obj.explode();
    }

    this.mGenerateParticles = 0;
    this.mCurrentState = Arrow.eArrowState.eHit;
};


ShockWave.prototype.calculateDistance = function (posX, posY) {
    return Math.sqrt(
        Math.pow(this.getXform().getXPos() - posX, 2) +
        Math.pow(this.getXform().getYPos() - posY, 2)
    );
};

ShockWave.prototype.shock = function () {
    var thisV = this.getRigidBody().getVelocity();
    var thisSpeed = Math.sqrt(thisV[0] * thisV[0], thisV[1] * thisV[1]);

    var pos = this.getXform().getPosition();

    var i;
    var obj;
    var objPos;
    var distance;
    for (i = 0; i < this.mAllObjs.size(); i++) {
        obj = this.mAllObjs.getObjectAt(i);
        objPos = obj.getRenderable().getXform().getPosition();
        distance = this.calculateDistance(objPos[0], objPos[1]);
        var speed;
        var velocity;

        if (distance <= 80) {
            speed = (80 - distance) * Math.sqrt(thisSpeed) * 0.20;
            velocity = vec2.fromValues(
                speed * (objPos[0] - pos[0]) / distance,
                speed * (objPos[1] - pos[1]) / distance
            );
            if (obj instanceof Archer) {
                obj.getRigidBody().setVelocity(velocity[0], velocity[1]);
            }
            else if (obj instanceof Bow) {
                obj.getRigidBody().setVelocity(velocity[0], velocity[1]);
            }
            else if (obj instanceof LifePotion) {
                obj.getRigidBody().setVelocity(velocity[0], velocity[1]);
            }
            else if (obj instanceof Mine) {
                obj.getRigidBody().setVelocity(velocity[0], velocity[1]);
            }
        }
    }
};