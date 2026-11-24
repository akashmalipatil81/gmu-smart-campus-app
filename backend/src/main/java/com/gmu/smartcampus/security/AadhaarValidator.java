package com.gmu.smartcampus.security;

/** Implements the same local Aadhaar format and Verhoeff checksum validation
 * used by the original GMU Smart Campus v3 Node.js login flow.
 * This validates format/checksum only; it does NOT verify identity with UIDAI. */
public final class AadhaarValidator {
    private AadhaarValidator() {}
    private static final int[][] D = {
        {0,1,2,3,4,5,6,7,8,9}, {1,2,3,4,0,6,7,8,9,5},
        {2,3,4,0,1,7,8,9,5,6}, {3,4,0,1,2,8,9,5,6,7},
        {4,0,1,2,3,9,5,6,7,8}, {5,9,8,7,6,0,4,3,2,1},
        {6,5,9,8,7,1,0,4,3,2}, {7,6,5,9,8,2,1,0,4,3},
        {8,7,6,5,9,3,2,1,0,4}, {9,8,7,6,5,4,3,2,1,0}
    };
    private static final int[][] P = {
        {0,1,2,3,4,5,6,7,8,9}, {1,5,7,6,2,8,3,0,9,4},
        {5,8,0,3,7,9,6,1,4,2}, {8,9,1,6,0,4,3,5,2,7},
        {9,4,5,3,1,2,6,8,7,0}, {4,2,8,6,5,7,3,9,0,1},
        {2,7,9,3,8,0,6,4,1,5}, {7,0,4,6,9,1,3,2,5,8}
    };
    public static String normalize(String value) {
        return value == null ? "" : value.replaceAll("[\\s-]", "");
    }
    public static boolean isValid(String input) {
        String number = normalize(input);
        if (!number.matches("^[2-9][0-9]{11}$")) return false;
        int checksum = 0;
        for (int i = 0; i < number.length(); i++) {
            int digit = number.charAt(number.length() - 1 - i) - '0';
            checksum = D[checksum][P[i % 8][digit]];
        }
        return checksum == 0;
    }
    public static String mask(String input) {
        String number = normalize(input);
        return number.length() == 12 ? "XXXX XXXX " + number.substring(8) : "";
    }
}
