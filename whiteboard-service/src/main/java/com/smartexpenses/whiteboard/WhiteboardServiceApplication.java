package com.smartexpenses.whiteboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication(scanBasePackages = "com.smartexpenses.whiteboard")
public class WhiteboardServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(WhiteboardServiceApplication.class, args);
	}

}
