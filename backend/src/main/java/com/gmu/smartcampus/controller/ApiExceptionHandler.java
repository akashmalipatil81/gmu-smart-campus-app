package com.gmu.smartcampus.controller;
import org.springframework.http.*;import org.springframework.web.bind.annotation.*;import java.util.*;
@RestControllerAdvice public class ApiExceptionHandler {
 @ExceptionHandler(ApiError.class) public ResponseEntity<Map<String,String>> handle(ApiError e){return ResponseEntity.status(e.getStatus()).body(Map.of("message",e.getMessage()));}
 @ExceptionHandler(IllegalArgumentException.class) public ResponseEntity<Map<String,String>> invalid(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}
 @ExceptionHandler(Exception.class) public ResponseEntity<Map<String,String>> other(Exception e){e.printStackTrace();return ResponseEntity.status(500).body(Map.of("message","Unexpected server error. Check backend console."));}
}
