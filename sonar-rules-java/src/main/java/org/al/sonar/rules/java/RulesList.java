/*
 * Copyright (C) 2012-2024 SonarSource SA - mailto:info AT sonarsource DOT com
 * This code is released under [MIT No Attribution](https://opensource.org/licenses/MIT-0) license.
 */
package org.al.sonar.rules.java;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.sonar.plugins.java.api.JavaCheck;
import org.al.sonar.rules.java.checks.AvoidAnnotationRule;
import org.al.sonar.rules.java.checks.AvoidBrandInMethodNamesRule;
import org.al.sonar.rules.java.checks.AvoidMethodDeclarationRule;
import org.al.sonar.rules.java.checks.AvoidSuperClassRule;
import org.al.sonar.rules.java.checks.AvoidTreeListRule;
import org.al.sonar.rules.java.checks.MyCustomSubscriptionRule;
import org.al.sonar.rules.java.checks.NoIfStatementInTestsRule;
import org.al.sonar.rules.java.checks.SecurityAnnotationMandatoryRule;
import org.al.sonar.rules.java.checks.SpringControllerRequestMappingEntityRule;

public final class RulesList {

  private RulesList() {
  }

  public static List<Class<? extends JavaCheck>> getChecks() {
    List<Class<? extends JavaCheck>> checks = new ArrayList<>();
    checks.addAll(getJavaChecks());
    checks.addAll(getJavaTestChecks());
    return Collections.unmodifiableList(checks);
  }

  /**
   * These rules are going to target MAIN code only
   */
  public static List<Class<? extends JavaCheck>> getJavaChecks() {
    return Collections.unmodifiableList(Arrays.asList(
      SpringControllerRequestMappingEntityRule.class,
      AvoidAnnotationRule.class,
      AvoidBrandInMethodNamesRule.class,
      AvoidMethodDeclarationRule.class,
      AvoidSuperClassRule.class,
      AvoidTreeListRule.class,
      MyCustomSubscriptionRule.class,
      SecurityAnnotationMandatoryRule.class));
  }

  /**
   * These rules are going to target TEST code only
   */
  public static List<Class<? extends JavaCheck>> getJavaTestChecks() {
    return Collections.unmodifiableList(Arrays.asList(
      NoIfStatementInTestsRule.class));
  }
}
