pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";

template GreatEq() {
    signal input a;
    signal input b;
    signal output Enough;

    // 8 bits is plenty to store quantity
    component gt = GreaterEqThan(8);
    gt.in[0] <== a;
    gt.in[1] <== b;

    Enough <== gt.out;
}

component main = GreatEq();





