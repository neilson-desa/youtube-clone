package com.neilsondesa.video_processing_spring_boot_service.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
public class ProcessVideoController {
    
    @GetMapping("/helloworld")
    public String helloWorld() {
        return "hello world";
    }
    
    @PostMapping("/process-video")
    public String processVideo(@RequestBody String entity) {
        //TODO: process POST request
        
        return entity;
    }

}
