package com.gmu.smartcampus.security;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AadhaarValidatorTest {
    // Synthetic checksum fixture only; it is not a real person's Aadhaar number.
    private static final String SYNTHETIC_VALID_NUMBER = "200000000009";

    @Test
    void normalizesSpacesAndHyphensLikeOriginalClient() {
        assertEquals(SYNTHETIC_VALID_NUMBER, AadhaarValidator.normalize("2000 0000-0009"));
    }

    @Test
    void validatesVerhoeffChecksumAndFormat() {
        assertTrue(AadhaarValidator.isValid(SYNTHETIC_VALID_NUMBER));
        assertFalse(AadhaarValidator.isValid("100000000009")); // first digit 1 is disallowed
        assertFalse(AadhaarValidator.isValid("200000000008")); // invalid checksum
        assertFalse(AadhaarValidator.isValid("12345678901"));  // not 12 digits
    }

    @Test
    void masksNumberInPublicResponses() {
        assertEquals("XXXX XXXX 0009", AadhaarValidator.mask(SYNTHETIC_VALID_NUMBER));
    }
}
