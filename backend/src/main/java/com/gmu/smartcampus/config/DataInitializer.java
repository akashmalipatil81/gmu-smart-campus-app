package com.gmu.smartcampus.config;
import com.gmu.smartcampus.entity.UserAccount;
import com.gmu.smartcampus.repository.UserRepository;
import com.gmu.smartcampus.service.CampusService;
import com.gmu.smartcampus.security.AadhaarValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.LocalDate;
import java.util.Map;
@Configuration public class DataInitializer {
 @Bean CommandLineRunner seed(UserRepository users, CampusService service,@Value("${app.admin.aadhaar:}") String configuredAadhaar,@Value("${app.admin.password}") String password){return args->{
  String aadhaar=AadhaarValidator.normalize(configuredAadhaar);if(AadhaarValidator.isValid(aadhaar)&&password.length()>=8&&password.matches("(?s).*[A-Za-z].*")&&password.matches("(?s).*[0-9].*")&&users.findByAadhaar(aadhaar).isEmpty()){UserAccount u=new UserAccount();u.setFullName("GMU System Administrator");u.setAadhaar(aadhaar);u.setDepartment("Administration");u.setRole("admin");u.setPasswordHash(service.encoder().encode(password));users.save(u);System.out.println("Initial admin created for masked Aadhaar "+AadhaarValidator.mask(aadhaar)+".");}else if(!users.findAll().stream().anyMatch(x->x.getRole().equals("admin"))){System.out.println("No admin seeded. Set APP_ADMIN_AADHAAR to a valid 12-digit Verhoeff-checksum Aadhaar and APP_ADMIN_PASSWORD (at least 8 characters with a letter and number) before first start.");}
  if(service.list("club").isEmpty()){service.save("club",Map.of("name","Coding Club","description","Programming, coding contests and software development.","coordinatorId",0,"active",true),null);service.save("club",Map.of("name","Robotics Club","description","Robotics, automation and embedded systems.","coordinatorId",0,"active",true),null);}
  if(service.list("seat").isEmpty()){for(int i=1;i<=12;i++)service.save("seat",Map.of("code","G-"+String.format("%02d",i),"floor","Ground Floor","status","AVAILABLE"),null);for(int i=1;i<=12;i++)service.save("seat",Map.of("code","F1-"+String.format("%02d",i),"floor","First Floor","status","AVAILABLE"),null);}
  if(service.list("event").isEmpty()){
   service.save("event",Map.of("title","Design Sprint: Solve for Campus","description","Sample event: join a collaborative design sprint to imagine useful improvements for campus life.","date",LocalDate.now().plusDays(5).toString(),"time","14:00","venue","Student Activity Center","capacity",120),null);
   service.save("event",Map.of("title","Founders' Day Commons","description","Sample event: meet student groups, share ideas and celebrate the GM University community.","date",LocalDate.now().plusDays(12).toString(),"time","11:30","venue","Central Lawn","capacity",250),null);
  }
  if(service.list("announcement").isEmpty()){
   service.save("announcement",Map.of("title","Welcome to GMU Smart Campus","message","This is sample campus content for your demo. Explore clubs, events, library seat bookings and student projects from your dashboard."),null);
   service.save("announcement",Map.of("title","Your campus, one connected place","message","Use the Events tab to discover activities and the Library tab to find a seat for your next study session."),null);
  }
 };}
}
