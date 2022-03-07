pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "abdk-libraries-solidity/ABDKMath64x64.sol";

library Common {
    using ABDKMath64x64 for int128;
    using SafeMath for uint256;
    using SafeMath for uint8;

    function isTraitEffectiveAgainst(uint8 attacker, uint8 defender) internal pure returns (bool) {
        return (((attacker + 1) % 4) == defender); // Thanks to Tourist
    }

    function getPlayerPower(
        uint24 basePower,
        int128 weaponMultiplier,
        uint24 bonusPower
    ) internal pure returns(uint24) {
        return uint24(weaponMultiplier.mulu(basePower).add(bonusPower));
    }


    function getBonusRanking(uint256 attackerPower, uint256 defenderPower) internal returns (uint256){

        uint256 bonusRanking = 0;
        // min roll = 30% max roll = 30%
        uint256 attackerMin = attackerPower.mul(70).div(100);
        uint256 attackerMax = attackerPower.mul(130).div(100);
 

        uint256 defenderMin = defenderPower.mul(70).div(100);
        uint256 defenderMax = defenderPower.mul(130).div(100);


        uint256 attackerNumbersBetween = attackerMax.sub(attackerMin);
        uint256 defenderNumbersBetween = defenderMax.sub(defenderMin);

        uint256 numbersThatBeat = defenderMax.sub(attackerMin);
 
        uint256 attackerChanceToRoll = numbersThatBeat.mul(100).div(attackerNumbersBetween);



        uint256 defenderChanceToRoll = numbersThatBeat.mul(100).div(defenderNumbersBetween);


        uint256 winChance = attackerChanceToRoll.mul(100).div(1000).mul(defenderChanceToRoll.mul(1000).div(100)).div(200);

        if (winChance < 50) {
            bonusRanking = getBonusRankingPoints(uint256(50).sub(winChance));
            return bonusRanking;
        }

    }
    function getBonusRankingPoints(uint256 processedWinChance) internal returns (uint256) {
        return (2**(processedWinChance/5)) - 1;
    }



    function getPlayerPowerBase100(
        uint256 basePower,
        int128 weaponMultiplier,
        uint24 bonusPower
    ) internal pure returns (uint24) {
        // we divide total power by 100 and add the base of 10000
       return uint24 (weaponMultiplier.mulu(basePower).add(bonusPower).div(100).add(1000));  
    }
    function getPowerAtLevel(uint8 level) internal pure returns (uint24) {
        // does not use fixed points since the numbers are simple
        // the breakpoints every 10 levels are floored as expected
        // level starts at 0 (visually 1)
        // 1000 at lvl 1
        // 9000 at lvl 51 (~3months)
        // 22440 at lvl 105 (~3 years)
        // 92300 at lvl 255 (heat death of the universe)
        return uint24(
            uint256(1000)
                .add(level.mul(10))
                .mul(level.div(10).add(1))
        );
    }
}
