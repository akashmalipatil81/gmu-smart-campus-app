package com.gmu.smartcampus.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gmu.smartcampus.entity.CampusRecord;
import com.gmu.smartcampus.entity.UserAccount;
import com.gmu.smartcampus.repository.CampusRecordRepository;
import com.gmu.smartcampus.repository.UserRepository;
import com.gmu.smartcampus.security.AadhaarValidator;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
public class CampusService {
    private final UserRepository users; private final CampusRecordRepository records; private final ObjectMapper mapper; private final BCryptPasswordEncoder encoder=new BCryptPasswordEncoder(12);
    public CampusService(UserRepository users, CampusRecordRepository records, ObjectMapper mapper){this.users=users;this.records=records;this.mapper=mapper;}
    public BCryptPasswordEncoder encoder(){return encoder;}
    public Map<String,Object> userView(UserAccount u){Map<String,Object> m=new LinkedHashMap<>();m.put("id",u.getId());m.put("fullName",u.getFullName());m.put("aadhaarMasked",AadhaarValidator.mask(u.getAadhaar()));m.put("email",u.getEmail());m.put("mobile",u.getMobile());m.put("department",u.getDepartment());m.put("semester",u.getSemester());m.put("role",u.getRole());m.put("active",u.isActive());m.put("createdAt",u.getCreatedAt().toString());return m;}
    public Map<String,Object> data(CampusRecord r){try{Map<String,Object> m=mapper.readValue(r.getPayload(),new TypeReference<>(){});m.put("id",r.getId());m.put("createdAt",r.getCreatedAt().toString());return m;}catch(Exception e){throw new IllegalStateException(e);}}
    public List<Map<String,Object>> list(String type){return records.findByRecordType(type).stream().map(this::data).toList();}
    public List<Map<String,Object>> owned(String type,Long owner){return records.findByRecordTypeAndOwnerId(type,owner).stream().map(this::data).toList();}
    public Map<String,Object> get(String type,Long id){return records.findById(id).filter(r->r.getRecordType().equals(type)).map(this::data).orElse(null);}
    public Map<String,Object> save(String type,Map<String,Object> values,Long owner){try{CampusRecord r=new CampusRecord();r.setRecordType(type);r.setOwnerId(owner);r.setPayload(mapper.writeValueAsString(values));return data(records.save(r));}catch(Exception e){throw new IllegalStateException(e);}}
    public Map<String,Object> update(String type,Long id,Map<String,Object> patch){try{CampusRecord r=records.findById(id).filter(x->x.getRecordType().equals(type)).orElseThrow(()->new IllegalArgumentException("Record not found."));Map<String,Object> m=data(r);m.remove("id");m.remove("createdAt");m.putAll(patch);r.setPayload(mapper.writeValueAsString(m));return data(records.save(r));}catch(IllegalArgumentException e){throw e;}catch(Exception e){throw new IllegalStateException(e);}}
    public void delete(String type,Long id){records.findById(id).filter(x->x.getRecordType().equals(type)).ifPresent(records::delete);}
    public void notify(Long userId,String title,String message){save("notification",Map.of("title",title,"message",message,"read",false),userId);}
    public List<Map<String,Object>> notifications(Long userId){return owned("notification",userId).stream().sorted((a,b)->String.valueOf(b.get("createdAt")).compareTo(String.valueOf(a.get("createdAt")))).toList();}
    public UserAccount findUser(Long id){return users.findById(id).orElse(null);}
    public UserAccount findByAadhaar(String aadhaar) {
        return users.findByAadhaar(AadhaarValidator.normalize(aadhaar)).orElse(null);
    }
    public List<Map<String,Object>> users(String role, String q) {
        return users.findAll().stream()
            .filter(u -> role == null || role.isBlank() || u.getRole().equals(role))
            .filter(u -> q == null || q.isBlank() || u.getFullName().toLowerCase().contains(q.toLowerCase())
                || AadhaarValidator.mask(u.getAadhaar()).toLowerCase().contains(q.toLowerCase()))
            .map(this::userView).toList();
    }
    public Map<String,Object> createUser(Map<String,Object> b, String role) {
        String aadhaar = AadhaarValidator.normalize(String.valueOf(b.getOrDefault("aadhaar", "")));
        if (!AadhaarValidator.isValid(aadhaar)) throw new IllegalArgumentException("Enter a valid 12-digit Aadhaar number.");
        if (users.findByAadhaar(aadhaar).isPresent()) throw new IllegalArgumentException("This Aadhaar number is already registered.");
        String fullName = String.valueOf(b.getOrDefault("fullName", "")).trim();
        if (fullName.length() < 3) throw new IllegalArgumentException("Enter the full name as per Aadhaar.");
        String mobile = String.valueOf(b.getOrDefault("mobile", "")).trim();
        if (!mobile.matches("^[6-9][0-9]{9}$")) throw new IllegalArgumentException("Enter a valid 10-digit mobile number.");
        String email = String.valueOf(b.getOrDefault("email", "")).trim();
        if (!email.isBlank() && users.findByEmailIgnoreCase(email).isPresent()) throw new IllegalArgumentException("This email is already registered.");
        String department = String.valueOf(b.getOrDefault("department", "")).trim();
        List<String> departments = List.of("Computer Science & Engineering", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Information Science", "Management Studies", "Commerce", "Arts & Humanities");
        if (!departments.contains(department)) throw new IllegalArgumentException("Select a valid department.");
        String semester = role.equals("student") ? String.valueOf(b.getOrDefault("semester", "")).trim() : "";
        if (role.equals("student") && !List.of("1", "2", "3", "4", "5", "6", "7", "8").contains(semester)) throw new IllegalArgumentException("Select a valid semester.");
        String pw = String.valueOf(b.getOrDefault("password", ""));
        if (pw.length() < 8 || !pw.matches("(?s).*[A-Za-z].*") || !pw.matches("(?s).*[0-9].*")) throw new IllegalArgumentException("Password must be at least 8 characters and include a letter and a number.");
        UserAccount u = new UserAccount();
        u.setFullName(fullName); u.setAadhaar(aadhaar); u.setEmail(email.isBlank() ? null : email);
        u.setMobile(mobile); u.setDepartment(department); u.setSemester(semester); u.setRole(role);
        u.setPasswordHash(encoder.encode(pw));
        return userView(users.save(u));
    }
    public Map<String,Object> publicRecord(Map<String,Object> x){return x;}
    public boolean isMember(Long projectId,Long userId){return list("project_member").stream().anyMatch(m->Objects.equals(num(m.get("projectId")),projectId)&&Objects.equals(num(m.get("userId")),userId));}
    public static Long num(Object o){try{return Long.valueOf(String.valueOf(o));}catch(Exception e){return null;}}
    public static String s(Map<String,Object> m,String k,String def){return String.valueOf(m.getOrDefault(k,def)).trim();}
    public static int i(Map<String,Object> m,String k,int def){try{return Integer.parseInt(String.valueOf(m.get(k)));}catch(Exception e){return def;}}
    @Transactional public synchronized Map<String,Object> book(Long userId,Map<String,Object> b){Long seatId=num(b.get("seatId"));String date=s(b,"date","");String start=s(b,"start","");String end=s(b,"end","");if(seatId==null||date.isBlank()||start.isBlank()||end.isBlank())throw new IllegalArgumentException("Select a seat, date and time.");if(!end.matches("\\d{2}:\\d{2}")||!start.matches("\\d{2}:\\d{2}"))throw new IllegalArgumentException("Invalid time range.");LocalTime st=LocalTime.parse(start),en=LocalTime.parse(end);if(!en.isAfter(st)||Duration.between(st,en).toMinutes()>240||st.isBefore(LocalTime.of(8,0))||en.isAfter(LocalTime.of(22,0)))throw new IllegalArgumentException("Bookings must be 08:00–22:00 and no longer than four hours.");Map<String,Object> seat=get("seat",seatId);if(seat==null)throw new IllegalArgumentException("Seat not found.");if("MAINTENANCE".equals(seat.get("status")))throw new IllegalArgumentException("This seat is under maintenance.");if(list("booking").stream().anyMatch(x->bookingBlocksAvailability(x)&&Objects.equals(num(x.get("seatId")),seatId)&&date.equals(x.get("date"))&&overlap(st,en,LocalTime.parse(s(x,"start","00:00")),LocalTime.parse(s(x,"end","00:00")))))throw new IllegalArgumentException("This seat is already reserved for an overlapping time.");if(list("booking").stream().anyMatch(x->bookingBlocksAvailability(x)&&Objects.equals(num(x.get("userId")),userId)&&date.equals(x.get("date"))))throw new IllegalArgumentException("You already have a library booking for this date.");Map<String,Object> booking=new LinkedHashMap<>();booking.put("seatId",seatId);booking.put("userId",userId);booking.put("date",date);booking.put("start",start);booking.put("end",end);booking.put("status","PENDING");return save("booking",booking,userId);}
    @Transactional public synchronized Map<String,Object> decideBooking(Long bookingId,String decision,Long adminId){Map<String,Object> booking=get("booking",bookingId);if(booking==null||!"PENDING".equals(booking.get("status")))throw new IllegalArgumentException("Pending reservation request not found.");if(!List.of("APPROVE","REJECT").contains(decision))throw new IllegalArgumentException("Choose approve or reject.");Long userId=num(booking.get("userId"));Map<String,Object> seat=get("seat",num(booking.get("seatId")));if(decision.equals("APPROVE")){if(seat==null)throw new IllegalArgumentException("The requested seat no longer exists.");if("MAINTENANCE".equals(seat.get("status")))throw new IllegalArgumentException("The requested seat is under maintenance.");LocalTime start=LocalTime.parse(s(booking,"start","00:00")),end=LocalTime.parse(s(booking,"end","00:00"));String date=s(booking,"date","");if(list("booking").stream().anyMatch(x->!Objects.equals(num(x.get("id")),bookingId)&&bookingBlocksAvailability(x)&&date.equals(x.get("date"))&&(Objects.equals(num(x.get("userId")),userId)||(Objects.equals(num(x.get("seatId")),num(booking.get("seatId")))&&overlap(start,end,LocalTime.parse(s(x,"start","00:00")),LocalTime.parse(s(x,"end","00:00")))))))throw new IllegalArgumentException("This reservation now conflicts with another booking.");booking.put("status","CONFIRMED");booking.put("decidedBy",adminId);update("booking",bookingId,booking);notify(userId,"Library reservation approved","Seat "+seat.get("code")+" is confirmed for "+date+" "+start+"–"+end+".");return get("booking",bookingId);}booking.put("status","REJECTED");booking.put("decidedBy",adminId);update("booking",bookingId,booking);notify(userId,"Library reservation rejected","Your request for seat "+(seat==null?"":seat.get("code"))+" on "+s(booking,"date","")+" was declined.");return get("booking",bookingId);}
    private boolean bookingBlocksAvailability(Map<String,Object> booking){Object status=booking.get("status");return status==null||"PENDING".equals(status)||"CONFIRMED".equals(status);}
    private boolean overlap(LocalTime a,LocalTime b,LocalTime c,LocalTime d){return a.isBefore(d)&&c.isBefore(b);}
}
