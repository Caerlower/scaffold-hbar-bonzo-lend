import { expect } from "chai";
import { ethers } from "hardhat";

describe("AuditAnchor", function () {
  async function deployFixture() {
    const [owner, alice] = await ethers.getSigners();
    const AuditAnchor = await ethers.getContractFactory("AuditAnchor");
    const anchor = await AuditAnchor.deploy();
    await anchor.waitForDeployment();
    return { anchor, owner, alice };
  }

  it("records an action for the caller", async function () {
    const { anchor, alice } = await deployFixture();
    const asset = "0x0000000000000000000000000000000000001549";
    const amount = ethers.parseUnits("10", 6);
    const hcsRef = ethers.id("hcs-seq-1");

    await expect(anchor.connect(alice).recordAction(0, asset, amount, hcsRef)).to.emit(anchor, "ActionAnchored");

    const record = await anchor.getAction(0);
    expect(record.user).to.equal(alice.address);
    expect(record.actionType).to.equal(0);
    expect(record.asset).to.equal(asset);
    expect(record.amount).to.equal(amount);
    expect(record.hcsRef).to.equal(hcsRef);
    expect(await anchor.actionCount()).to.equal(1);

    const ids = await anchor.getUserActionIds(alice.address);
    expect(ids.map(n => Number(n))).to.deep.equal([0]);
  });

  it("rejects zero asset", async function () {
    const { anchor } = await deployFixture();
    await expect(anchor.recordAction(1, ethers.ZeroAddress, 1n, ethers.ZeroHash)).to.be.revertedWith(
      "AuditAnchor: zero asset",
    );
  });

  it("tracks multiple actions per user", async function () {
    const { anchor, alice } = await deployFixture();
    const asset = "0x0000000000000000000000000000000000003ad2";
    await anchor.connect(alice).recordAction(0, asset, 1n, ethers.ZeroHash);
    await anchor.connect(alice).recordAction(2, asset, 2n, ethers.ZeroHash);
    expect(await anchor.actionCount()).to.equal(2);
    const ids = await anchor.getUserActionIds(alice.address);
    expect(ids.length).to.equal(2);
  });
});
