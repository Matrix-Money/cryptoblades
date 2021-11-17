import BigNumber from 'bignumber.js';
import { Web3JsCallOptions, Web3JsAbiCall, Web3JsSendOptions } from '../../abi-common';
import { Contract, Contracts } from './interfaces';

export type CryptoBladesAlias = NonNullable<Contracts['CryptoBlades']>;
export type NFTMarketAlias = NonNullable<Contracts['NFTMarket']>;

type MethodsFunction<T extends Contract<unknown>> = (contract: T['methods']) => Web3JsAbiCall<string>;
type CryptoBladesMethodsFunction = MethodsFunction<CryptoBladesAlias>;

export async function getFeeInSkillFromUsdFromAnyContract<T extends Contract<unknown>>(
  cryptoBladesContract: CryptoBladesAlias,
  feeContract: T,
  opts: Web3JsCallOptions,
  fn: MethodsFunction<T>
): Promise<string> {
  const feeInUsd = await fn(feeContract.methods).call(opts);

  const feeInSkill = await cryptoBladesContract.methods
    .usdToSkill(feeInUsd)
    .call(opts);

  return feeInSkill;
}

export async function getFeeInSkillFromUsd(
  cryptoBladesContract: CryptoBladesAlias,
  opts: Web3JsCallOptions,
  fn: CryptoBladesMethodsFunction
): Promise<string> {
  return getFeeInSkillFromUsdFromAnyContract(
    cryptoBladesContract,
    cryptoBladesContract,
    opts,
    fn
  );
}

type WithOptionalFrom<T extends { from: unknown }> = Omit<T, 'from'> & Partial<Pick<T, 'from'>>;

export async function approveFeeFromAnyContract<T extends Contract<unknown>>(
  cryptoBladesContract: CryptoBladesAlias,
  feeContract: T,
  skillToken: Contracts['SkillToken'],
  from: NonNullable<Web3JsCallOptions['from']>,
  skillRewardsAvailable: string,
  callOpts: WithOptionalFrom<Web3JsCallOptions>,
  approveOpts: WithOptionalFrom<Web3JsSendOptions>,
  fn: MethodsFunction<T>,
  { feeMultiplier, allowInGameOnlyFunds, payToAddress }: { feeMultiplier?: string | number, allowInGameOnlyFunds?: boolean, payToAddress?: string } = {},
  fnReturnsSkill: boolean = false
) {
  const callOptsWithFrom: Web3JsCallOptions = { from, ...callOpts };
  const approveOptsWithFrom: Web3JsSendOptions = { from, ...approveOpts };

  if(allowInGameOnlyFunds === undefined) {
    allowInGameOnlyFunds = true;
  }

  let feeInSkill = new BigNumber(
    fnReturnsSkill ?
      await fn(feeContract.methods).call(callOptsWithFrom) :
      await getFeeInSkillFromUsdFromAnyContract(
        cryptoBladesContract,
        feeContract,
        callOptsWithFrom,
        fn
      )
  );

  if(feeMultiplier !== undefined) {
    feeInSkill = feeInSkill.times(feeMultiplier);
  }

  try {
    feeInSkill = await cryptoBladesContract.methods
      .getSkillNeededFromUserWallet(from, feeInSkill.toString(), allowInGameOnlyFunds)
      .call(callOptsWithFrom)
      .then(n => new BigNumber(n));
  }
  catch(err) {
    const paidByRewardPool = feeInSkill.lte(skillRewardsAvailable);

    if(paidByRewardPool) {
      return null;
    }
  }

  let payTo = payToAddress;
  if(payTo === undefined) {
    payTo = feeContract !== cryptoBladesContract ? feeContract.options.address : cryptoBladesContract.options.address;
  }

  const allowance = await skillToken.methods
    .allowance(from, payTo)
    .call(callOptsWithFrom);

  if(feeInSkill.lte(allowance)) {
    return null;
  }

  return await skillToken.methods
    .approve(feeContract !== cryptoBladesContract ? feeContract.options.address : cryptoBladesContract.options.address, feeInSkill.toString())
    .send(approveOptsWithFrom);
}

export async function approveFee(
  cryptoBladesContract: CryptoBladesAlias,
  skillToken: Contracts['SkillToken'],
  from: NonNullable<Web3JsCallOptions['from']>,
  skillRewardsAvailable: string,
  callOpts: WithOptionalFrom<Web3JsCallOptions>,
  approveOpts: WithOptionalFrom<Web3JsSendOptions>,
  fn: CryptoBladesMethodsFunction,
  opts: { feeMultiplier?: string | number, allowInGameOnlyFunds?: boolean } = {}
) {
  return await approveFeeFromAnyContract(
    cryptoBladesContract,
    cryptoBladesContract,
    skillToken,
    from,
    skillRewardsAvailable,
    callOpts,
    approveOpts,
    fn,
    opts
  );
}

export async function waitUntilEvent(contract: Contract<unknown>, eventName: string, opts: Record<string, unknown>): Promise<Record<string, unknown>> {
  let subscriber: any;

  const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
    subscriber = contract.events[eventName](opts, (err: Error | null, data: Record<string, unknown> | null) => {
      if(err) reject(err);
      else resolve(data!);
    });
  });

  subscriber.unsubscribe();

  return data;
}
