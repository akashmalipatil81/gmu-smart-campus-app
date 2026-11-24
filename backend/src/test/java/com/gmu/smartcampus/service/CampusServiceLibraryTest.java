package com.gmu.smartcampus.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gmu.smartcampus.entity.CampusRecord;
import com.gmu.smartcampus.repository.CampusRecordRepository;
import com.gmu.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CampusServiceLibraryTest {
    private CampusRecordRepository records;
    private CampusService service;

    @BeforeEach
    void setUp() {
        records = mock(CampusRecordRepository.class);
        service = new CampusService(mock(UserRepository.class), records, new ObjectMapper());
        when(records.findById(12L)).thenReturn(Optional.of(record("seat", "{\"code\":\"G-12\",\"status\":\"AVAILABLE\"}")));
        when(records.save(any(CampusRecord.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void newBookingIsCreatedAsPendingRequest() {
        when(records.findByRecordType("booking")).thenReturn(List.of());

        Map<String, Object> booking = service.book(99L, Map.of(
            "seatId", 12, "date", "2026-11-20", "start", "09:00", "end", "11:00"
        ));

        assertEquals("PENDING", booking.get("status"));
        verify(records).save(any(CampusRecord.class));
    }

    @Test
    void pendingRequestsPreventAnOverlappingBooking() {
        CampusRecord pending = record("booking", "{\"seatId\":12,\"userId\":88,\"date\":\"2026-11-20\",\"start\":\"09:00\",\"end\":\"11:00\",\"status\":\"PENDING\"}");
        when(records.findByRecordType("booking")).thenReturn(List.of(pending));

        assertThrows(IllegalArgumentException.class, () -> service.book(99L, Map.of(
            "seatId", 12, "date", "2026-11-20", "start", "10:00", "end", "12:00"
        )));
        verify(records, never()).save(any(CampusRecord.class));
    }

    @Test
    void rejectedRequestsDoNotBlockTheSeat() {
        CampusRecord rejected = record("booking", "{\"seatId\":12,\"userId\":88,\"date\":\"2026-11-20\",\"start\":\"09:00\",\"end\":\"11:00\",\"status\":\"REJECTED\"}");
        when(records.findByRecordType("booking")).thenReturn(List.of(rejected));

        Map<String, Object> booking = service.book(99L, Map.of(
            "seatId", 12, "date", "2026-11-20", "start", "09:00", "end", "11:00"
        ));

        assertEquals("PENDING", booking.get("status"));
        verify(records).save(any(CampusRecord.class));
    }

    @Test
    void adminCanApprovePendingReservation() {
        CampusRecord pending = record("booking", "{\"seatId\":12,\"userId\":99,\"date\":\"2026-11-20\",\"start\":\"09:00\",\"end\":\"11:00\",\"status\":\"PENDING\"}");
        when(records.findById(77L)).thenReturn(Optional.of(pending));
        when(records.findByRecordType("booking")).thenReturn(List.of());

        Map<String, Object> booking = service.decideBooking(77L, "APPROVE", 1L);

        assertEquals("CONFIRMED", booking.get("status"));
        assertEquals(1, booking.get("decidedBy"));
    }

    @Test
    void adminCanRejectPendingReservation() {
        CampusRecord pending = record("booking", "{\"seatId\":12,\"userId\":99,\"date\":\"2026-11-20\",\"start\":\"09:00\",\"end\":\"11:00\",\"status\":\"PENDING\"}");
        when(records.findById(77L)).thenReturn(Optional.of(pending));

        Map<String, Object> booking = service.decideBooking(77L, "REJECT", 1L);

        assertEquals("REJECTED", booking.get("status"));
        assertEquals(1, booking.get("decidedBy"));
    }

    private CampusRecord record(String type, String payload) {
        CampusRecord record = new CampusRecord();
        record.setRecordType(type);
        record.setPayload(payload);
        return record;
    }
}
